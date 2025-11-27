import os
import re
import csv

directory = '/home/sajad-yoosuf/Desktop/allora/spaAdminLatest/src/Clientsidepage'
output_file = 'page_modal_analysis.csv'

def analyze_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Strategy 1: Find state variables controlling modals (e.g., showAddModal)
    # Matches: const [showAddModal, setShowAddModal]
    state_matches = re.findall(r'const\s+\[show(\w+),\s+setShow\1\]', content)
    
    # Strategy 2: Find defined Modal components in the same file
    # Matches: const AddModal = or function AddModal
    # Enforce PascalCase (starts with uppercase) to avoid functions like handleCloseModal
    defined_matches = re.findall(r'(?:const|function)\s+([A-Z]\w+Modal)\s*=', content)
    defined_matches += re.findall(r'function\s+([A-Z]\w+Modal)\s*\(', content)

    modal_names = set()
    for name in state_matches:
        # Clean up names like 'AddModal' -> 'Add Modal'
        # If the state is 'showAddModal', the name captured is 'AddModal' (or just 'Add' if variable is showAdd)
        # The regex captures 'Add' from 'showAdd'. So we append 'Modal' if it's not there.
        if not name.endswith('Modal'):
            modal_names.add(f"{name} Modal")
        else:
            modal_names.add(name)
    
    for name in defined_matches:
        modal_names.add(name)

    return list(modal_names)

results = []

for filename in os.listdir(directory):
    if filename.endswith('.jsx') and filename != 'Selectcalander.jsx':
        filepath = os.path.join(directory, filename)
        modals = analyze_file(filepath)
        results.append({
            'Page': filename,
            'Modal Count': len(modals),
            'Modals': ', '.join(sorted(modals))
        })

# Sort by modal count desc
results.sort(key=lambda x: x['Modal Count'], reverse=True)

with open(output_file, 'w', newline='') as csvfile:
    fieldnames = ['Page', 'Modal Count', 'Modals']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    for row in results:
        writer.writerow(row)

print(f"Analysis complete. CSV written to {output_file}")
