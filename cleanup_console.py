#!/usr/bin/env python3
"""
Remove standalone console.log statements from JavaScript file
"""
import re
import sys

def should_remove_line(line):
    """Check if line should be removed"""
    stripped = line.strip()
    
    # Remove standalone console.log lines
    if stripped.startswith('console.log(') and stripped.endswith(');'):
        return True
    
    # Remove commented console.log
    if stripped.startswith('//') and 'console.log' in stripped:
        return True
        
    return False

def clean_file(input_file, output_file):
    """Clean the file"""
    removed_count = 0
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    cleaned_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        if should_remove_line(line):
            removed_count += 1
            i += 1
            continue
            
        cleaned_lines.append(line)
        i += 1
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(cleaned_lines)
    
    print(f"Removed {removed_count} lines")
    print(f"Original: {len(lines)} lines")
    print(f"Cleaned: {len(cleaned_lines)} lines")

if __name__ == '__main__':
    input_file = 'src/Clientsidepage/Selectcalander.jsx'
    output_file = 'src/Clientsidepage/Selectcalander.jsx'
    clean_file(input_file, output_file)
