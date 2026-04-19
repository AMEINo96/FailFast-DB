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
    """Route 1: Explore Projects"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Querying the View built by the team
        cursor.execute("SELECT * FROM vw_project_failure_summary;")
        projects = cursor.fetchall()
        return jsonify(projects), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/submit_idea', methods=['POST'])
def submit_idea():
    """Route 2: Submit Idea / Evaluate"""
    data = request.get_json()
    
    title = data.get('title')
    description = data.get('description')
    category_name = data.get('category_name')
    failure_type = data.get('failure_type')
    reason_desc = data.get('reason_desc')
    
    if not all([title, description, category_name, failure_type, reason_desc]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()
        
        # Call the Stored Procedure
        # sp_add_project_with_reason(p_title, p_description, p_category_name, p_failure_type, p_reason_desc, OUT p_project_id)
        # We pass 0 as a placeholder for the OUT parameter
        result_args = cursor.callproc('sp_add_project_with_reason', (
            title, 
            description, 
            category_name, 
            failure_type, 
            reason_desc, 
            0 
        ))
        
        conn.commit()
        
        # The OUT parameter is returned at index 5 of result_args
        new_project_id = result_args[5]
        
        return jsonify({
            "message": "Project added successfully!",
            "project_id": new_project_id
        }), 201
    except Error as e:
        conn.rollback()
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
