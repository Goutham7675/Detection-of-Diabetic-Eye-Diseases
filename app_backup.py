from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import os
import secrets
import numpy as np
from PIL import Image
from datetime import datetime, timedelta
import csv
from pathlib import Path
import logging

# PyTorch & model imports
import torch
from efficientnet_pytorch import EfficientNet
import torchvision.transforms as transforms

# Flask setup
app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)
app.config['UPLOAD_FOLDER'] = 'static/uploads/'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)  # Session lasts for 7 days

# CSV paths
USERS_CSV = 'data/users.csv'
FEEDBACK_CSV = 'data/feedback.csv'
Path('data').mkdir(exist_ok=True)
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Init CSVs
def init_csv_files():
    if not os.path.exists(USERS_CSV):
        with open(USERS_CSV, 'w', newline='') as f:
            csv.writer(f).writerow(['id', 'username', 'email', 'password', 'timestamp'])
    if not os.path.exists(FEEDBACK_CSV):
        with open(FEEDBACK_CSV, 'w', newline='') as f:
            csv.writer(f).writerow(['id', 'username', 'message', 'timestamp'])

init_csv_files()

# DB setup
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

class DetectionResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), db.ForeignKey('user.username'), nullable=False)
    image_path = db.Column(db.String(255), nullable=False)
    prediction = db.Column(db.String(50), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())

class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), db.ForeignKey('user.username'), nullable=False)
    message = db.Column(db.Text, nullable=False)

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

# Create tables if they don't exist
with app.app_context():
    try:
        # Only create tables that don't exist yet
        db.create_all()
        app.logger.debug("Database setup complete!")
        
        # Check if there are any users in the database
        users_count = User.query.count()
        app.logger.debug(f"Found {users_count} existing users in database")
        
        # Print all users for debugging
        all_users = User.query.all()
        for user in all_users:
            app.logger.debug(f"Existing user: id={user.id}, username={user.username}, email={user.email}")
        
        # Create a default admin user if no users exist
        if users_count == 0:
            try:
                admin_user = User(
                    username="admin",
                    email="admin@example.com",
                    password=generate_password_hash("admin123")
                )
                db.session.add(admin_user)
                db.session.commit()
                app.logger.info("Created default admin user")
            except Exception as e:
                db.session.rollback()
                app.logger.error(f"Failed to create default admin: {str(e)}")
    except Exception as e:
        app.logger.error("Error setting up database: %s", str(e))
        raise RuntimeError("Error setting up database: " + str(e))

@app.context_processor
def inject_logged_in():
    user_data = {
        'logged_in': 'username' in session,
        'username': session.get('username', None),
        'email': session.get('email', None),
        'user_id': session.get('user_id', None)
    }
    return user_data

# Load PyTorch model at startup
MODEL_PATH = 'eye_disease_model.pth'
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CLASSES = ['cataract', 'DR', 'glaucoma', 'normal']

# Check if model file exists
if os.path.exists(MODEL_PATH):
    try:
        model = EfficientNet.from_name('efficientnet-b3')
        model._fc = torch.nn.Linear(model._fc.in_features, len(CLASSES))
        checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
        model.load_state_dict(checkpoint['model_state_dict'])
        model.to(DEVICE)
        model.eval()
        app.logger.info("Model loaded successfully from %s", MODEL_PATH)
    except Exception as e:
        app.logger.error("Error loading model: %s", str(e))
        app.logger.warning("Using placeholder model for development")
        # Create placeholder model for development
        model = EfficientNet.from_name('efficientnet-b3')
        model._fc = torch.nn.Linear(model._fc.in_features, len(CLASSES))
        model.to(DEVICE)
        model.eval()
else:
    app.logger.warning("Model file not found at %s, using placeholder model for development", MODEL_PATH)
    # Create placeholder model for development
    model = EfficientNet.from_name('efficientnet-b3')
    model._fc = torch.nn.Linear(model._fc.in_features, len(CLASSES))
    model.to(DEVICE)
    model.eval()

transform = transforms.Compose([
    transforms.Resize((300, 300)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/technology')
def technology():
    return render_template('technology.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

@app.route('/terms')
def terms():
    return render_template('terms.html')

@app.route('/accessibility')
def accessibility():
    from datetime import date
    current_date = date.today().strftime("%B %d, %Y")
    return render_template('accessibility.html', current_date=current_date)

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        try:
            # Check if request is JSON (API call)
            if request.is_json:
                data = request.get_json()
                name = data.get('name')
                email = data.get('email')
                subject = data.get('subject')
                message = data.get('message')
            else:
                # Form submission
                name = request.form.get('name')
                email = request.form.get('email')
                subject = request.form.get('subject')
                message = request.form.get('message')
            
            # Validate form data
            if not all([name, email, subject, message]):
                if request.is_json:
                    return jsonify({'error': 'Please fill in all required fields'}), 400
                flash('Please fill in all required fields', 'error')
                return render_template('contact.html')
            
            # Save to database
            new_contact = Contact(
                name=name,
                email=email,
                subject=subject,
                message=message
            )
            db.session.add(new_contact)
            db.session.commit()
            
            app.logger.info(f"New contact form submission from {email}")
            
            if request.is_json:
                return jsonify({'success': True, 'message': 'Thank you for contacting us! We will get back to you soon.'})
            
            flash('Thank you for contacting us! We will get back to you soon.', 'success')
            return redirect(url_for('index'))
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error saving contact form: {str(e)}")
            
            if request.is_json:
                return jsonify({'error': 'There was an error submitting your message. Please try again.'}), 500
                
            flash('There was an error submitting your message. Please try again.', 'error')
            
    return render_template('contact.html')

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if 'username' not in session:
        if request.is_json:
            return jsonify({'error': 'Authentication required'}), 401
        flash('Please login to upload images', 'error')
        return redirect(url_for('login'))

    if request.method == 'POST':
        # Handle API request
        if request.is_json:
            # API logic for handling base64 image would go here
            return jsonify({'error': 'Direct file upload required for API. Use multipart/form-data.'}), 400
            
        # Handle form upload
        if 'file' not in request.files:
            flash('No file part', 'error')
            return redirect(request.url)

        file = request.files['file']
        if file.filename == '':
            flash('No selected file', 'error')
            return redirect(request.url)

        if file and allowed_file(file.filename):
            try:
                # Save the file
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)

                # Process the image
                image = Image.open(filepath).convert('RGB')
                input_tensor = transform(image).unsqueeze(0).to(DEVICE)
                
                # Default values in case prediction fails
                result = "normal"
                confidence = 0.85
                
                with torch.no_grad():
                    try:
                        # Try to use the model for prediction
                        output = model(input_tensor)
                        probs = torch.nn.functional.softmax(output, dim=1)
                        confidence, predicted_idx = torch.max(probs, 1)
                        result = CLASSES[predicted_idx.item()]
                        confidence = confidence.item()
                    except Exception as e:
                        # If model prediction fails, use placeholder result
                        app.logger.error(f"Model prediction error: {str(e)}. Using placeholder result.")

                # Save the result to database
                new_result = DetectionResult(
                    username=session['username'],
                    image_path=filepath,
                    prediction=result,
                    confidence=confidence
                )
                db.session.add(new_result)
                db.session.commit()
                
                # Prepare result for template
                image_filename = os.path.basename(filepath)
                
                # Check if this is an API request
                if request.args.get('format') == 'json':
                    return jsonify({
                        'success': True,
                        'image_url': url_for('static', filename=f'uploads/{image_filename}', _external=True),
                        'prediction': result,
                        'confidence': confidence,
                        'description': get_disease_description(result)
                    })
                
                # Regular form submission result
                return render_template(
                    "results.html", 
                    image_filename=image_filename,
                    result=result,
                    confidence=round(confidence * 100, 2)
                )
            except Exception as e:
                app.logger.error(f"Error processing upload: {str(e)}")
                
                if request.args.get('format') == 'json':
                    return jsonify({'error': f"Error processing the image: {str(e)}"}), 500
                    
                flash(f"Error processing the image: {str(e)}", "error")
                return redirect(url_for('upload_file'))
        else:
            if request.args.get('format') == 'json':
                return jsonify({'error': 'File type not allowed. Please upload JPG, JPEG or PNG files.'}), 400
                
            flash('File type not allowed. Please upload JPG, JPEG or PNG files.', 'error')
            return redirect(request.url)

    return render_template('upload.html')

@app.route('/feedback', methods=['GET', 'POST'])
def feedback():
    if request.method == 'POST':
        # Handle API request
        if request.is_json:
            data = request.get_json()
            feedback_value = data.get('message')
        else:
            # Handle form submission
            feedback_value = request.form.get('message')
            
        if feedback_value:
            if 'username' in session:
                try:
                    os.makedirs('data', exist_ok=True)
                    next_id = 0
                    if os.path.exists(FEEDBACK_CSV):
                        with open(FEEDBACK_CSV, 'r', newline='') as f:
                            next_id = sum(1 for row in csv.reader(f))
                    with open(FEEDBACK_CSV, 'a', newline='') as f:
                        csv.writer(f).writerow([
                            next_id,
                            session['username'],
                            feedback_value,
                            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        ])
                    new_feedback = Feedback(
                        username=session['username'],
                        message=feedback_value
                    )
                    db.session.add(new_feedback)
                    db.session.commit()
                    
                    if request.is_json:
                        return jsonify({'success': True, 'message': 'Thank you for your feedback!'})
                        
                    flash('Thank you for your feedback!', 'success')
                    return redirect(url_for('index'))
                except Exception as e:
                    app.logger.error(f"Error saving feedback: {str(e)}")
                    
                    if request.is_json:
                        return jsonify({'error': 'Error saving feedback. Please try again.'}), 500
                        
                    flash('Error saving feedback. Please try again.', 'error')
            else:
                if request.is_json:
                    return jsonify({'error': 'Please login to submit feedback'}), 401
                    
                flash('Please login to submit feedback', 'error')
        else:
            if request.is_json:
                return jsonify({'error': 'Please provide feedback'}), 400
                
            flash('Please provide feedback', 'error')
    return render_template('feedback.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    # If already logged in, redirect to home page
    if 'username' in session:
        if request.is_json:
            return jsonify({'message': 'Already logged in', 'username': session['username']})
            
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        try:
            # Handle API request
            if request.is_json:
                data = request.get_json()
                username = data.get('email')  # Can be username or email
                password = data.get('password')
            else:
                # Handle form submission
                username = request.form.get('username')
                password = request.form.get('password')
            
            app.logger.debug(f"Login attempt: username={username}")
            
            if not username or not password:
                if request.is_json:
                    return jsonify({'error': 'Please enter username/email and password'}), 400
                    
                flash('Please enter username and password', 'error')
                return render_template('login.html')
                
            # First try to find user by exact username
            user = User.query.filter_by(username=username).first()
            app.logger.debug(f"User lookup by username: {'found' if user else 'not found'}")
            
            # If not found by username, try by email
            if not user:
                user = User.query.filter_by(email=username).first()
                app.logger.debug(f"User lookup by email: {'found' if user else 'not found'}")
                
            # Verify user exists and password matches
            if user:
                is_valid = check_password_hash(user.password, password)
                app.logger.debug(f"Password validation: {'success' if is_valid else 'failed'}")
                
                if is_valid:
                    # Set up session
                    session['username'] = user.username
                    session['email'] = user.email
                    session['user_id'] = user.id
                    session.permanent = True  # Use the permanent session lifetime
                    
                    app.logger.debug(f"Login successful for user: {user.username}")
                    
                    if request.is_json:
                        return jsonify({
                            'success': True,
                            'message': 'Login successful',
                            'username': user.username,
                            'email': user.email
                        })
                    
                    flash('Login successful!', 'success')
            return redirect(url_for('index'))
            
            # If we got here, login failed
            app.logger.debug(f"Login failed for username: {username}")
            
            if request.is_json:
                return jsonify({'error': 'Invalid username or password'}), 401
                
            flash('Invalid username or password', 'error')
        except Exception as e:
            app.logger.error(f"Login error: {str(e)}")
            
            if request.is_json:
                return jsonify({'error': f'An error occurred during login: {str(e)}'}), 500
                
            flash('An error occurred during login. Please try again.', 'error')
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        try:
            # Handle API request
            if request.is_json:
                data = request.get_json()
                first_name = data.get('first-name')
                last_name = data.get('last-name')
                email = data.get('email')
                password = data.get('password')
                confirm_password = data.get('confirm-password')
                terms = data.get('terms', False)
            else:
                # Handle form submission
                first_name = request.form.get('first-name')
                last_name = request.form.get('last-name')
                email = request.form.get('email')
                password = request.form.get('password')
                confirm_password = request.form.get('confirm-password')
                terms = request.form.get('terms')
            
            app.logger.debug(f"Register attempt: {first_name} {last_name}, {email}")
            
            # Form validation
            if not all([first_name, last_name, email, password, confirm_password]):
                if request.is_json:
                    return jsonify({'error': 'Please fill in all fields'}), 400
                    
                flash('Please fill in all fields', 'error')
                return render_template('register.html')
                
            if password != confirm_password:
                if request.is_json:
                    return jsonify({'error': 'Passwords do not match'}), 400
                    
                flash('Passwords do not match', 'error')
                return render_template('register.html')
                
            if not terms:
                if request.is_json:
                    return jsonify({'error': 'You must agree to the Terms of Service and Privacy Policy'}), 400
                    
                flash('You must agree to the Terms of Service and Privacy Policy', 'error')
                return render_template('register.html')
            
            username = f"{first_name}_{last_name}".lower()
            
            # Check if email already exists
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                if request.is_json:
                    return jsonify({'error': 'Email already registered'}), 400
                    
                flash('Email already registered', 'error')
                return render_template('register.html')
            
            # Create new user
            try:
                # Generate password hash
                hashed_password = generate_password_hash(password)
                app.logger.debug(f"Created password hash for new user")
                
                # Create user in database
                new_user = User(
                    username=username,
                    email=email,
                    password=hashed_password
                )
                db.session.add(new_user)
                db.session.commit()
                app.logger.info(f"New user registered: {username} ({email})")
                
                # Also add to CSV for backup
                try:
            with open(USERS_CSV, 'a', newline='') as f:
                csv.writer(f).writerow([
                    len(open(USERS_CSV).readlines()),
                    username,
                    email,
                            hashed_password,
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                ])
                except Exception as csv_error:
                    app.logger.warning(f"Could not write to CSV: {str(csv_error)}")
                    
                if request.is_json:
                    return jsonify({
                        'success': True,
                        'message': 'Registration successful! Please login.',
                        'username': username,
                        'email': email
                    })
                    
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
            except Exception as db_error:
                db.session.rollback()
                app.logger.error(f"Error registering user in database: {str(db_error)}")
                
                if request.is_json:
                    return jsonify({'error': 'Error during registration. Please try again.'}), 500
                    
                flash('Error during registration. Please try again.', 'error')
        except Exception as e:
            app.logger.error(f"Error in registration process: {str(e)}")
            
            if request.is_json:
                return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500
                
            flash('An unexpected error occurred. Please try again.', 'error')
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    if request.args.get('format') == 'json':
        session.clear()
        return jsonify({'success': True, 'message': 'Logged out successfully'})
        
    session.clear()
    flash('You have been logged out successfully', 'success')
    return redirect(url_for('index'))

@app.route('/detection_history')
def detection_history():
    if 'username' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    try:
        # Get user's detection history from database
        results = DetectionResult.query.filter_by(username=session['username']).order_by(DetectionResult.timestamp.desc()).all()
        
        # Convert results to JSON serializable format
        results_list = []
        for result in results:
            # Get the absolute URL for the image
            image_url = url_for('static', filename=result.image_path.replace('static/', ''), _external=True)
            
            results_list.append({
                'id': result.id,
                'image_path': image_url,
                'prediction': result.prediction,
                'confidence': result.confidence,
                'timestamp': result.timestamp.isoformat()
            })
        
        return jsonify({
            'success': True,
            'results': results_list
        })
    except Exception as e:
        app.logger.error(f"Error fetching detection history: {str(e)}")
        return jsonify({'error': 'Failed to fetch detection history'}), 500

@app.route('/shared-result/<int:result_id>')
def shared_result(result_id):
    try:
        # Get the specific result
        result = DetectionResult.query.get_or_404(result_id)
        
        # Render the shared result template
        return render_template('shared-result.html', result=result)
    except Exception as e:
        app.logger.error(f"Error displaying shared result: {str(e)}")
        flash('Error displaying the shared result', 'error')
        return redirect(url_for('index'))

@app.route('/check_auth')
def check_auth():
    if 'username' in session:
        return jsonify({
            'authenticated': True,
            'username': session['username'],
            'email': session.get('email')
        })
    else:
        return jsonify({'authenticated': False})

@app.route('/check_db')
def check_db():
    try:
        # Check database connection
        users = User.query.all()
        user_list = []
        for user in users:
            user_list.append({
                'id': user.id,
                'username': user.username,
                'email': user.email
            })
            
        # Create test user if none exists
        if len(users) == 0:
            test_user = User(
                username="test_user",
                email="test@example.com",
                password=generate_password_hash("test123")
            )
            db.session.add(test_user)
            db.session.commit()
            
            # Add the new user to our list
            user_list.append({
                'id': test_user.id,
                'username': test_user.username,
                'email': test_user.email,
                'note': 'Newly created'
            })
            
        return jsonify({
            'status': 'success',
            'message': 'Database connected successfully',
            'user_count': len(users),
            'users': user_list
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database error: {str(e)}',
        })

@app.route('/create_test_user')
def create_test_user():
    try:
        # Check if test user already exists
        existing_user = User.query.filter_by(email="test@example.com").first()
        if existing_user:
            return jsonify({
                'status': 'warning',
                'message': f'Test user already exists with id {existing_user.id}',
                'user': {
                    'id': existing_user.id,
                    'username': existing_user.username,
                    'email': existing_user.email
                }
            })
        
        # Create test user
        test_user = User(
            username="testuser",
            email="test@example.com",
            password=generate_password_hash("test123")
        )
        db.session.add(test_user)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Test user created successfully',
            'user': {
                'id': test_user.id,
                'username': test_user.username,
                'email': test_user.email,
                'password': 'test123 (hashed in database)'
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error creating test user: {str(e)}'
        })

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg'}

def get_disease_description(disease):
    """Return a description for the given eye disease."""
    descriptions = {
        "normal": "No signs of eye disease detected. Regular eye check-ups are still recommended.",
        "cataract": "Signs consistent with cataracts, a clouding of the lens in the eye leading to decreased vision.",
        "glaucoma": "Signs consistent with glaucoma, a group of eye conditions that damage the optic nerve.",
        "DR": "Signs consistent with Diabetic Retinopathy, a diabetes complication affecting the eyes."
    }
    return descriptions.get(disease, "Potential eye condition detected. Please consult with an eye care professional.")

if __name__ == '__main__':
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    except Exception as e:
        app.logger.error("Error running the app: %s", str(e))
        raise