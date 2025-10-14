import os
import re

def fix_jinja_templates():
    templates_dir = 'templates'
    
    # Get all HTML files
    html_files = [os.path.join(templates_dir, f) for f in os.listdir(templates_dir) if f.endswith('.html')]
    
    # Regular expression to find malformed Jinja2 tags
    pattern = r'(href|src)="{ url_for\(([^)]+)\) }"'
    replacement = r'\1="{{ url_for(\2) }}"'
    
    for file_path in html_files:
        print(f"Processing {file_path}...")
        
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Check if there are broken templates
        if re.search(pattern, content):
            # Replace broken templates
            modified = re.sub(pattern, replacement, content)
            
            # Write back to file
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(modified)
            
            print(f"Fixed Jinja2 templates in {file_path}")
        else:
            print(f"No broken templates found in {file_path}")

if __name__ == "__main__":
    fix_jinja_templates() 