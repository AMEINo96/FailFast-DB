from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environmental variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes so the Next.js frontend can communicate with it
CORS(app) 

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'mysql-77d9ae-potatoplayz96-cb73.g.aivencloud.com'),
            port=int(os.getenv('DB_PORT', 22137)),
            user=os.getenv('DB_USER', 'avnadmin'),
            password=os.getenv('DB_PASSWORD', 'your_password_here'),
            database=os.getenv('DB_DATABASE', 'defaultdb')
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL Database: {e}")
        return None

@app.route('/api/explore', methods=['GET'])
def explore_projects():
    """Route 1: Explore Projects with Tags and Descriptions"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Custom SQL to fetch core data + tags via GROUP_CONCAT
        query = """
            SELECT 
                p.project_id, 
                p.title, 
                p.description, 
                p.status, 
                c.category_name as category,
                (SELECT GROUP_CONCAT(t.tag_name) 
                 FROM Project_Tags pt 
                 JOIN Tags t ON pt.tag_id = t.tag_id 
                 WHERE pt.project_id = p.project_id) as tags_string,
                (SELECT AVG(rating) FROM Feedback WHERE project_id = p.project_id) as avg_rating
            FROM Projects p
            LEFT JOIN Categories c ON p.category_id = c.category_id
            ORDER BY p.created_at DESC;
        """
        cursor.execute(query)
        projects = cursor.fetchall()
        
        # Convert tags_string to an array
        for p in projects:
            p['tags'] = p['tags_string'].split(',') if p['tags_string'] else []
            p['avg_feedback_rating'] = float(p['avg_rating']) if p['avg_rating'] else 0
            del p['tags_string']
            del p['avg_rating']

        return jsonify(projects), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/project/<int:project_id>', methods=['GET'])
def get_project_details(project_id):
    """New Route: Fetch full details for a single project"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. Fetch main project info
        cursor.execute("""
            SELECT p.*, c.category_name 
            FROM Projects p 
            LEFT JOIN Categories c ON p.category_id = c.category_id 
            WHERE p.project_id = %s
        """, (project_id,))
        project = cursor.fetchone()
        
        if not project:
            return jsonify({"error": "Project not found"}), 404

        # 2. Fetch tags
        cursor.execute("""
            SELECT t.tag_name 
            FROM Project_Tags pt 
            JOIN Tags t ON pt.tag_id = t.tag_id 
            WHERE pt.project_id = %s
        """, (project_id,))
        project['tags'] = [row['tag_name'] for row in cursor.fetchall()]

        # 3. Fetch failure reasons
        cursor.execute("""
            SELECT fr.reason_desc as description, ft.type_name as reason_type
            FROM Failure_Reasons fr
            JOIN Failure_Types ft ON fr.type_id = ft.type_id
            WHERE fr.project_id = %s
        """, (project_id,))
        project['failure_reasons'] = cursor.fetchall()

        # 4. Fetch feedback
        cursor.execute("SELECT * FROM Feedback WHERE project_id = %s ORDER BY created_at DESC", (project_id,))
        project['feedback'] = cursor.fetchall()

        # 5. Fetch suggestions
        cursor.execute("SELECT * FROM Suggestions WHERE project_id = %s ORDER BY created_at DESC", (project_id,))
        project['suggestions'] = cursor.fetchall()

        return jsonify(project), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/submit_idea', methods=['POST'])
def submit_idea():
    """Route 2: Submit Idea with Stored Procedure + Tag Handling"""
    data = request.get_json()
    
    title = data.get('title')
    description = data.get('description')
    category_name = data.get('category_name')
    failure_type = data.get('failure_type')
    reason_desc = data.get('reason_desc')
    tags = data.get('tags', []) # New: receiving tags
    
    if not all([title, description, category_name, failure_type, reason_desc]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()
        
        # Call Stored Procedure
        result_args = cursor.callproc('sp_add_project_with_reason', (
            title, 
            description, 
            category_name, 
            failure_type, 
            reason_desc, 
            0 
        ))
        conn.commit()
        new_project_id = result_args[5]
        
        # --- Handle Tags Logic (Strict Normalization) ---
        for tag_name in tags:
            tag_name = tag_name.strip().lower()
            if not tag_name: continue
            
            # Check if tag exists
            cursor.execute("SELECT tag_id FROM Tags WHERE tag_name = %s", (tag_name,))
            tag_row = cursor.fetchone()
            
            if tag_row:
                tag_id = tag_row[0]
            else:
                # Insert new tag
                cursor.execute("INSERT INTO Tags (tag_name) VALUES (%s)", (tag_name,))
                tag_id = cursor.lastrowid
            
            # Link to project
            cursor.execute("INSERT IGNORE INTO Project_Tags (project_id, tag_id) VALUES (%s, %s)", (new_project_id, tag_id))
        
        conn.commit()
        
        return jsonify({
            "message": "Project and tags added successfully!",
            "project_id": new_project_id
        }), 201
    except Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """New Route: Save Feedback"""
    data = request.get_json()
    project_id = data.get('project_id')
    user_id = data.get('user_id')
    rating = data.get('rating')
    comment = data.get('comment')

    if not all([project_id, rating, comment]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Feedback (project_id, user_id, rating, comment) VALUES (%s, %s, %s, %s)",
            (project_id, user_id, rating, comment)
        )
        conn.commit()
        return jsonify({"success": True}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/suggestion', methods=['POST'])
def submit_suggestion():
    """New Route: Save Suggestion"""
    data = request.get_json()
    project_id = data.get('project_id')
    user_id = data.get('user_id')
    description = data.get('description')

    if not all([project_id, description]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Suggestions (project_id, user_id, description) VALUES (%s, %s, %s)",
            (project_id, user_id, description)
        )
        conn.commit()
        return jsonify({"success": True}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/signup', methods=['POST'])
def signup():
    """Route 3: User Sign Up"""
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    
    if not all([name, email]):
        return jsonify({"error": "Name and email are required"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()
        # Insert with default role_id = 4 (Contributor) per instruction
        insert_query = "INSERT INTO Users (role_id, name, email) VALUES (4, %s, %s)"
        cursor.execute(insert_query, (name, email))
        conn.commit()
        
        new_user_id = cursor.lastrowid
        return jsonify({
            "message": "User signed up successfully", 
            "user_id": new_user_id
        }), 201
    except Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
