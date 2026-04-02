"""
Build InternMatch Desktop .exe using PyInstaller
Run: python build.py
"""
import subprocess
import sys
import os

def build():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dist_dir = os.path.join(project_root, 'dist')
    app_py = os.path.join(project_root, 'desktop', 'app.py')
    
    if not os.path.exists(dist_dir):
        print("ERROR: No dist/ folder found. Run 'npm run build' first.")
        sys.exit(1)
    
    cmd = [
        sys.executable, '-m', 'PyInstaller',
        '--name', 'InternMatch',
        '--onefile',
        '--windowed',
        '--add-data', f'{dist_dir};dist',
        '--distpath', os.path.join(project_root, 'dist-desktop'),
        '--workpath', os.path.join(project_root, 'dist-desktop', 'build'),
        '--specpath', os.path.join(project_root, 'dist-desktop'),
        app_py
    ]
    
    print("Building InternMatch.exe ...")
    print(f"Command: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)
    print("\nBuild complete! Find your .exe at: dist-desktop/InternMatch.exe")

if __name__ == '__main__':
    build()
