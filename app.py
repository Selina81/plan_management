from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
import sqlite3

from flask_cors import CORS # type: ignore

app = Flask(__name__, static_folder='static')
DATABASE = 'to_do_list.db'
CORS(app)

# Serve the HTML file at the root URL
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# Utility function to fetch database connection
def get_db_connection():
    conn = sqlite3.connect('to_do_list.db')  # Your database file
    conn.row_factory = sqlite3.Row  # This makes it easier to work with results as dictionaries
    return conn

# Route to add a new plan
@app.route('/api/plans', methods=['POST'])
def add_plan():
    data = request.get_json()
    title = data.get('title')
    start_date = data.get('start_date')
    end_date = data.get('end_date')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Insert the plan into the database
        cursor.execute('''
            INSERT INTO plans (title, start_date, end_date)
            VALUES (?, ?, ?)
        ''', (title, start_date, end_date))

        conn.commit()
        conn.close()

        return jsonify({"message": "Plan added successfully!"}), 201
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

# Route to fetch all plans
@app.route('/api/plans', methods=['GET'])
def get_plans():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM plans')
    plans = cursor.fetchall()

    conn.close()

    # Convert results to list of dictionaries
    return jsonify([{
        "id": plan['id'],
        "title": plan['title'],
        "status": plan['status'],
        "start_date": plan['create_date'],
        "end_date": plan['end_date']
    } for plan in plans])

@app.route('/api/done-plans', methods=['GET'])
def get_done_plans():
    one_year_ago = datetime.now() - timedelta(days=365)
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, title, create_date, end_date, status
        FROM plans
        WHERE status = 'Completed' AND end_date >= ?
    """, (one_year_ago,))
    plans = cursor.fetchall()
    conn.close()

    plans_list = [{
        "id": plan['id'],
        "title": plan['title'],
        "start_date": plan['create_date'],
        "end_date": plan['end_date']
    } for plan in plans]

    return jsonify(plans_list)

@app.route('/api/cleanup', methods=['POST'])
def cleanup_old_done_plans():
    one_year_ago = datetime.now() - timedelta(days=365)
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM plans
        WHERE status = 'Completed' AND completed_date < ?
    """, (one_year_ago,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Old completed plans removed."}), 200

# Route to add a new task
@app.route('/api/tasks', methods=['POST'])
def add_task():
    try:
        data = request.get_json()
        if not data or 'name' not in data or 'due_date' not in data or 'plan_id' not in data:
            return jsonify({'error': 'Invalid input: "name", "due_date", and "plan_id" are required'}), 400

        name = data['name']
        description = data.get('description', '')
        date_added = data.get('date_added', datetime.utcnow().isoformat())
        due_date = data['due_date']
        plan_id = data['plan_id']

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO tasks (name, description, date_added, due_date, plan_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, description, date_added, due_date, plan_id))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Task added successfully!'}), 201
    except Exception as e:
        print(f"Error adding task: {e}")
        return jsonify({'error': str(e)}), 500

# Route to fetch all tasks
@app.route('/api/tasks/<int:plan_id>', methods=['GET'])
def get_tasks(plan_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM tasks WHERE plan_id = ?
        ''', (plan_id,))

        tasks = cursor.fetchall()
        conn.close()

        tasks_list = [dict(task) for task in tasks]
        return jsonify(tasks_list), 200
    except Exception as e:
        print(f"Error fetching tasks: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/done', methods=['PUT'])
def mark_task_as_done(task_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE tasks SET completed = 1 WHERE id = ?
        ''', (task_id,))

        if cursor.rowcount == 0:
            return jsonify({'error': 'Task not found'}), 404

        conn.commit()
        conn.close()

        return jsonify({'message': 'Task marked as done!'}), 200
    except Exception as e:
        print(f"Error marking task as done: {e}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/plans/<int:plan_id>/done', methods=['PUT'])
def mark_plan_done(plan_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if the plan exists
        cursor.execute("SELECT * FROM plans WHERE id = ?", (plan_id,))
        plan = cursor.fetchone()
        if not plan:
            return jsonify({'message': 'Plan not found'}), 404

        # Update the plan's status to 'Completed'
        cursor.execute("UPDATE plans SET status = 'Completed' WHERE id = ?", (plan_id,))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Plan marked as done'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500    

if __name__ == '__main__':
    app.run(debug=True)
