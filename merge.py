import os

# Faltu folders ko ignore karne ke liye
EXCLUDE_DIRS = {'node_modules', '.git', 'venv', '__pycache__', '.next', 'dist', 'build'}

# Sirf jaruri files ka code uthane ke liye
ALLOWED_EXTENSIONS = {'.js', '.py', '.java', '.html', '.css', '.sql', '.ts', '.jsx', '.tsx', '.json'}

with open("all_code.txt", "w", encoding="utf-8") as outfile:
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            _, ext = os.path.splitext(file)
            if file in {'merge.py', 'all_code.txt'}:
                continue
            if ext.lower() in ALLOWED_EXTENSIONS:
                file_path = os.path.join(root, file)
                outfile.write(f"\n\n{'='*40}\n FILE: {file_path}\n{'='*40}\n\n")
                try:
                    with open(file_path, "r", encoding="utf-8") as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write(f"[Could not read file {file}: {e}]")

print("Saara code 'all_code.txt' mein save ho gaya hai!")

# python merge.py