from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
from datetime import date, datetime
from decimal import Decimal
import json

# Load environmental variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes so the Next.js frontend can communicate with it
CORS(app) 

# Custom JSON encoder to handle MySQL datetime and Decimal types
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

app.json_encoder = CustomJSONEncoder

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

def serialize_row(row):
    """Convert a dictionary row so all values are JSON-serializable."""
    result = {}
    for key, value in row.items():
        if isinstance(value, (datetime, date)):
            result[key] = value.isoformat()
        elif isinstance(value, Decimal):
            result[key] = float(value)
        else:
            result[key] = value
    return result

@app.route('/api/explore', methods=['GET'])
def explore_projects():
    """Route 1: Explore Projects with Tags and Descriptions"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
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
    """Fetch full details for a single project including comments"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. Fetch main project info
        cursor.execute(
            "SELECT p.project_id, p.title, p.description, p.status, "
            "c.category_name, p.created_at "
            "FROM Projects p "
            "LEFT JOIN Categories c ON p.category_id = c.category_id "
            "WHERE p.project_id = %s",
            (project_id,)
        )
        raw_project = cursor.fetchone()
        project = serialize_row(raw_project) if raw_project else None
        
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
        try:
            cursor.execute(
                "SELECT fr.reason_id, fr.project_id, fr.type_id, "
                "ft.type_name as reason_type "
                "FROM Failure_Reasons fr "
                "JOIN Failure_Types ft ON fr.type_id = ft.type_id "
                "WHERE fr.project_id = %s",
                (project_id,)
            )
            raw_reasons = cursor.fetchall()
            project['failure_reasons'] = [serialize_row(r) for r in raw_reasons]
        except Exception:
            project['failure_reasons'] = []

        # 4. Fetch all comments (feedback with user names)
        try:
            cursor.execute(
                "SELECT f.feedback_id, f.project_id, f.user_id, f.rating, f.comment, "
                "f.created_at, COALESCE(u.name, 'Anonymous') as user_name "
                "FROM Feedback f "
                "LEFT JOIN Users u ON f.user_id = u.user_id "
                "WHERE f.project_id = %s "
                "ORDER BY f.created_at DESC",
                (project_id,)
            )
            raw_comments = cursor.fetchall()
            project['comments'] = [serialize_row(c) for c in raw_comments]
        except Exception:
            project['comments'] = []

        # 5. Calculate average rating
        if project['comments']:
            ratings = [c.get('rating', 0) for c in project['comments'] if c.get('rating')]
            project['avg_rating'] = round(sum(ratings) / len(ratings), 1) if ratings else 0
        else:
            project['avg_rating'] = 0

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
    tags = data.get('tags', [])
    
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
            
            cursor.execute("SELECT tag_id FROM Tags WHERE tag_name = %s", (tag_name,))
            tag_row = cursor.fetchone()
            
            if tag_row:
                tag_id = tag_row[0]
            else:
                cursor.execute("INSERT INTO Tags (tag_name) VALUES (%s)", (tag_name,))
                tag_id = cursor.lastrowid
            
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

@app.route('/api/comment', methods=['POST'])
def submit_comment():
    """Save a comment with rating on a project"""
    data = request.get_json()
    project_id = data.get('project_id')
    user_id = data.get('user_id')
    rating = data.get('rating')
    comment = data.get('comment')

    if not all([project_id, comment]):
        return jsonify({"error": "Missing required fields"}), 400

    if not rating or int(rating) < 1 or int(rating) > 5:
        rating = None

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    try:
        # Convert user_id to int if possible
        safe_user_id = None
        if user_id:
            try:
                safe_user_id = int(user_id)
            except (ValueError, TypeError):
                safe_user_id = None
        
        # If no valid user_id, find or create a guest user
        if safe_user_id is None:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT user_id FROM Users WHERE name = 'Guest'")
            guest = cursor.fetchone()
            if guest:
                safe_user_id = guest['user_id']
            else:
                cursor.execute("INSERT INTO Users (role_id, name, email) VALUES (4, 'Guest', 'guest@failfast.app')")
                conn.commit()
                safe_user_id = cursor.lastrowid
            cursor.close()
        
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Feedback (project_id, user_id, rating, comment) VALUES (%s, %s, %s, %s)",
            (project_id, safe_user_id, rating, comment)
        )
        conn.commit()
        return jsonify({"success": True, "message": "Comment posted!"}), 201
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

@app.route('/api/analyze', methods=['POST'])
def analyze_idea():
    """Analyze an idea against the database — find similar projects and predict success."""
    data = request.get_json()
    title = data.get('title', '')
    description = data.get('description', '')
    category = data.get('category', '')
    tags = data.get('tags', [])

    if not title or not description:
        return jsonify({"error": "Title and description are required"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # --- 1. Find similar projects ---
        # Build a set of conditions for similarity
        similar_ids = set()

        # 1a. Category match
        if category:
            cursor.execute(
                "SELECT p.project_id FROM Projects p "
                "LEFT JOIN Categories c ON p.category_id = c.category_id "
                "WHERE c.category_name = %s",
                (category,)
            )
            for row in cursor.fetchall():
                similar_ids.add(row['project_id'])

        # 1b. Tag overlap — projects sharing at least one tag
        if tags:
            placeholders = ','.join(['%s'] * len(tags))
            cursor.execute(
                "SELECT DISTINCT pt.project_id FROM Project_Tags pt "
                "JOIN Tags t ON pt.tag_id = t.tag_id "
                "WHERE LOWER(t.tag_name) IN (" + placeholders + ")",
                tuple(t.strip().lower() for t in tags)
            )
            for row in cursor.fetchall():
                similar_ids.add(row['project_id'])

        # 1c. Keyword match on title/description
        keywords = [w for w in title.lower().split() if len(w) > 3]
        for kw in keywords[:5]:  # Limit to 5 keywords
            cursor.execute(
                "SELECT project_id FROM Projects "
                "WHERE LOWER(title) LIKE %s OR LOWER(description) LIKE %s",
                (f'%{kw}%', f'%{kw}%')
            )
            for row in cursor.fetchall():
                similar_ids.add(row['project_id'])

        # --- 2. Fetch full details for similar projects ---
        similar_projects = []
        if similar_ids:
            id_list = ','.join(str(pid) for pid in similar_ids)
            cursor.execute(
                "SELECT p.project_id, p.title, p.description, p.status, "
                "c.category_name as category, "
                "(SELECT AVG(f.rating) FROM Feedback f WHERE f.project_id = p.project_id) as avg_rating, "
                "(SELECT GROUP_CONCAT(t.tag_name) FROM Project_Tags pt "
                "JOIN Tags t ON pt.tag_id = t.tag_id WHERE pt.project_id = p.project_id) as tags_str "
                "FROM Projects p "
                "LEFT JOIN Categories c ON p.category_id = c.category_id "
                "WHERE p.project_id IN (" + id_list + ") "
                "ORDER BY p.created_at DESC LIMIT 20"
            )
            for row in cursor.fetchall():
                similar_projects.append({
                    'project_id': row['project_id'],
                    'title': row['title'],
                    'description': row['description'] or '',
                    'status': row['status'] or 'Unknown',
                    'category': row['category'] or '',
                    'avg_rating': round(float(row['avg_rating']), 1) if row['avg_rating'] else 0,
                    'tags': row['tags_str'].split(',') if row['tags_str'] else []
                })

        # --- 3. Compute prediction score ---
        total = len(similar_projects)
        failed = sum(1 for p in similar_projects if p['status'] == 'Failed')
        active = sum(1 for p in similar_projects if p['status'] == 'Active')
        success = sum(1 for p in similar_projects if p['status'] in ('Successful', 'Success', 'Completed'))
        other = total - failed - active - success

        # Calculate average community rating across similar projects
        rated = [p['avg_rating'] for p in similar_projects if p['avg_rating'] > 0]
        avg_community_rating = round(sum(rated) / len(rated), 1) if rated else 0

        # Prediction logic
        if total == 0:
            prediction_score = 65  # No data → neutral-optimistic
            risk_level = "Low"
        else:
            # Base: success rate
            success_rate = ((success + active * 0.5) / total) * 100
            failure_rate = (failed / total) * 100

            # Score: start at 50, adjust based on data
            prediction_score = 50
            prediction_score += (success_rate * 0.3)   # Boost for successes
            prediction_score -= (failure_rate * 0.25)   # Penalize for failures
            prediction_score += (avg_community_rating - 2.5) * 5  # Rating modifier

            # Clamp between 5 and 95
            prediction_score = max(5, min(95, round(prediction_score)))

            if prediction_score >= 65:
                risk_level = "Low"
            elif prediction_score >= 40:
                risk_level = "Medium"
            else:
                risk_level = "High"

        # --- 4. Generate insights ---
        insights = []
        if total > 0:
            insights.append(f"Found {total} similar project{'s' if total != 1 else ''} in the database.")
            if failed > 0:
                insights.append(f"{failed} out of {total} similar projects failed ({round(failed/total*100)}%).")
            if success > 0:
                insights.append(f"{success} similar project{'s' if success != 1 else ''} achieved success.")
            if active > 0:
                insights.append(f"{active} similar project{'s' if active != 1 else ''} {'are' if active != 1 else 'is'} still active.")
            if avg_community_rating > 0:
                insights.append(f"Average community rating for similar ideas: {avg_community_rating}/5.")
        else:
            insights.append("No similar projects found — this could be a fresh market opportunity!")
            insights.append("With no prior data, we estimate a moderate success chance.")

        # --- 5. Get common failure types ---
        if similar_ids:
            try:
                cursor.execute(
                    "SELECT ft.type_name, COUNT(*) as cnt "
                    "FROM Failure_Reasons fr "
                    "JOIN Failure_Types ft ON fr.type_id = ft.type_id "
                    "WHERE fr.project_id IN (" + id_list + ") "
                    "GROUP BY ft.type_name ORDER BY cnt DESC LIMIT 3"
                )
                failure_types = cursor.fetchall()
                if failure_types:
                    top = failure_types[0]
                    insights.append(f"Most common failure type: {top['type_name']} ({top['cnt']} occurrences).")
            except Exception:
                pass

        return jsonify({
            "similar_projects": similar_projects,
            "analysis": {
                "total_similar": total,
                "failed_count": failed,
                "success_count": success,
                "active_count": active,
                "success_rate": round(((success + active * 0.5) / total) * 100) if total > 0 else 0,
                "avg_community_rating": avg_community_rating,
                "prediction_score": prediction_score,
                "risk_level": risk_level,
                "insights": insights
            }
        }), 200

    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
