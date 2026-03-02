#!/usr/bin/env python3
import subprocess
import sys
import os

PROJECT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "project")
FIREBASE_PROJECT = "electroarenagames"


def run(cmd, cwd=PROJECT_DIR):
    print(f"\n  > {cmd}\n")
    return subprocess.run(cmd, shell=True, cwd=cwd).returncode


def ensure_deps():
    if not os.path.isdir(os.path.join(PROJECT_DIR, "node_modules")):
        print("\n  📦 node_modules not found, installing...\n")
        if run("npm install") != 0:
            print("  ❌ npm install failed.")
            return False
    return True


def do_dev():
    if not ensure_deps():
        return
    print("\n  🛠️  Starting dev server (Ctrl+C to stop)...\n")
    run("npm run dev")


def do_build():
    if not ensure_deps():
        return False
    print("\n  🔨 Building for production...\n")
    code = run("npm run build")
    if code != 0:
        print("\n  ❌ Build failed!")
        return False
    print("\n  ✅ Build succeeded! Output → project/dist/")
    return True


def do_deploy():
    if not do_build():
        return

    check = subprocess.run("firebase --version", shell=True, capture_output=True, text=True)
    if check.returncode != 0:
        print("\n  ❌ Firebase CLI not found!")
        print("     Install it:  npm install -g firebase-tools")
        print("     Then login:  firebase login")
        return

    print(f"\n  🚀 Deploying to Firebase ({FIREBASE_PROJECT})...")
    print(f"     Firebase CLI: {check.stdout.strip()}\n")

    code = run(f"firebase deploy --only hosting --project {FIREBASE_PROJECT}")
    if code != 0:
        print("\n  ❌ Deploy failed! Try running:  firebase login")
        return

    print(f"\n  ✅ Deployed!")
    print(f"     https://{FIREBASE_PROJECT}.web.app")


def do_preview():
    print("\n  🔄 Rebuilding before preview...")
    if not do_build():
        return
    print("\n  👀 Previewing production build (Ctrl+C to stop)...\n")
    run("npm run preview")


def do_install():
    print("\n  📦 Installing dependencies...\n")
    code = run("npm install")
    if code == 0:
        print("\n  ✅ Dependencies installed!")
    else:
        print("\n  ❌ Install failed!")


def menu():
    print("""
  ╔════════════════════════════════════════════════════════════╗
  ║            ⚡ Electro-Wizards-Arena-Online ⚡              ║
  ╠════════════════════════════════════════════════════════════╣
  ║                                                            ║
  ║   1 │ Dev Server                                           ║
  ║     │ Starts a local dev server with hot-reload.           ║
  ║     │ Open the URL shown in the terminal to play.          ║
  ║     │ Changes you make to code update instantly.           ║
  ║                                                            ║
  ║   2 │ Build                                                ║
  ║     │ Creates an optimized production build in dist/.      ║
  ║     │ Run this before deploying or to check for errors.    ║
  ║                                                            ║
  ║   3 │ Build + Deploy                                       ║
  ║     │ Builds the project, then deploys it live to          ║
  ║     │ Firebase Hosting. Requires firebase-tools and        ║
  ║     │ being logged in (firebase login).                    ║
  ║                                                            ║
  ║   4 │ Preview                                              ║
  ║     │ Serves the production build locally so you can       ║
  ║     │ test it before deploying. Builds first if needed.    ║
  ║                                                            ║
  ║   5 │ Install Dependencies                                 ║
  ║     │ Runs npm install to fetch all packages.              ║
  ║     │ Use this if you just cloned or pulled new changes.   ║
  ║                                                            ║
  ║   0 │ Exit                                                 ║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
""")

    choice = input("  Pick a number: ").strip()

    actions = {
        "1": do_dev,
        "2": do_build,
        "3": do_deploy,
        "4": do_preview,
        "5": do_install,
        "0": lambda: sys.exit(0),
    }

    action = actions.get(choice)
    if action:
        action()
    else:
        print(f"\n  ⚠️  '{choice}' is not a valid option, try again.\n")
        menu()


if __name__ == "__main__":
    menu()
