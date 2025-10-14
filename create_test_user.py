from app import app, db, User
from werkzeug.security import generate_password_hash

# Create application context
with app.app_context():
    # Check if user already exists
    existing_user = User.query.filter_by(username='testuser').first()
    if existing_user:
        print('Test user already exists')
    else:
        # Create test user
        test_user = User(
            username='testuser',
            email='test@example.com',
            password=generate_password_hash('password123')
        )
        
        # Add to database
        db.session.add(test_user)
        db.session.commit()
        
        print('Test user created successfully') 