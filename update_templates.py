import os
import re

def update_html_files():
    templates_dir = 'templates'
    html_files = [f for f in os.listdir(templates_dir) if f.endswith('.html')]
    
    # Regular expressions for finding and replacing links
    # CSS and JS links - note the patterns are updated to match the actual paths
    css_pattern = re.compile(r'href=["\']styles/([^"\']+)["\']')
    js_pattern = re.compile(r'src=["\']js/([^"\']+)["\']')
    
    # Internal links to HTML files
    html_link_pattern = re.compile(r'href=["\']([a-zA-Z0-9_-]+\.html)["\']')
    
    # Fix broken url_for templates (missing proper curly braces)
    broken_url_for_pattern = re.compile(r'href=["\']\{ url_for\([\'"]static[\'"], filename=[\'"]([^\'"]+)[\'"]\) \}["\']')
    broken_url_for_js_pattern = re.compile(r'src=["\']\{ url_for\([\'"]static[\'"], filename=[\'"]([^\'"]+)[\'"]\) \}["\']')
    
    # Map of HTML files to Flask routes
    route_map = {
        'index.html': "{{ url_for('index') }}",
        'about.html': "{{ url_for('about') }}",
        'technology.html': "{{ url_for('technology') }}",
        'privacy.html': "{{ url_for('privacy') }}",
        'terms.html': "{{ url_for('terms') }}",
        'contact.html': "{{ url_for('contact') }}",
        'upload.html': "{{ url_for('upload_file') }}",
        'feedback.html': "{{ url_for('feedback') }}",
        'login.html': "{{ url_for('login') }}",
        'register.html': "{{ url_for('register') }}",
        'logout.html': "{{ url_for('logout') }}"
    }
    
    for html_file in html_files:
        file_path = os.path.join(templates_dir, html_file)
        print(f"Processing {html_file}...")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Replace CSS links
            content = css_pattern.sub(lambda m: f'href="{{ url_for(\'static\', filename=\'styles/{m.group(1)}\') }}"', content)
            
            # Replace JS links
            content = js_pattern.sub(lambda m: f'src="{{ url_for(\'static\', filename=\'js/{m.group(1)}\') }}"', content)
            
            # Fix broken url_for templates (missing curly braces)
            content = broken_url_for_pattern.sub(lambda m: f'href="{{ url_for(\'static\', filename=\'{m.group(1)}\') }}"', content)
            content = broken_url_for_js_pattern.sub(lambda m: f'src="{{ url_for(\'static\', filename=\'{m.group(1)}\') }}"', content)
            
            # Replace internal links
            for html_link, flask_route in route_map.items():
                pattern = f'href=[\'"]({html_link})[\'"]'
                content = re.sub(pattern, f'href={flask_route}', content)
            
            # Write the updated content back to the file
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(content)
            
            print(f"Updated {html_file}")
        except Exception as e:
            print(f"Error updating {html_file}: {str(e)}")
    
if __name__ == "__main__":
    update_html_files()
    print("All templates updated successfully!") 