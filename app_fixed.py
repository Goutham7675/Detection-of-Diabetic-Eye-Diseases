# Fixed feedback function
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

# Fixed register function
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