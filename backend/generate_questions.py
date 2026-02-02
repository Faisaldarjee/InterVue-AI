
import json
import os
import time
from dotenv import load_dotenv
from llm_service import EnhancedLLMService

# Load env for API key
load_dotenv()

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "questions.json")

# Define target roles and how many questions we want for each
TARGET_ROLES = {
    "Data Analyst": 30,
    "Data Scientist": 30,
    "NLP Engineer": 30,
    "AI Engineer": 30,
    "Deep Learning Engineer": 30,
    "Computer Vision Engineer": 30,
    "Generative AI Engineer": 30,
    "Data Engineer": 30,
    "MLOps Engineer": 30,
    "Business Intelligence Analyst": 30,
    "Product Analyst": 30,
    "Marketing Data Analyst": 30,
    "Quantitative Analyst": 30,
    "Decision Scientist": 30,
    "Python Developer": 30,
    "Machine Learning Engineer": 30,
    "Backend Developer": 30,
    "Frontend Developer": 30,
    "DevOps Engineer": 30,
    "General": 30 
}

def generate_database():
    print("🚀 Starting AI-Powered Question Bank Generation...")
    
    try:
        llm = EnhancedLLMService()
    except Exception as e:
        print(f"❌ Failed to init LLM: {e}")
        return

    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        
    # Load existing DB
    final_db = {}
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r') as f:
                final_db = json.load(f)
                print(f"ℹ️ Loaded existing DB with {len(final_db)} roles.")
        except:
            print("⚠️ Could not load existing DB, starting fresh.")
            pass
            
    total_generated = 0
    
    # Roles to overwrite with new "Job Ready" questions
    FORCE_REFRESH = ["Data Analyst", "Data Scientist", "AI Engineer", "Machine Learning Engineer"]

    for role, count in TARGET_ROLES.items():
        if role in final_db and len(final_db[role]) > 0 and role not in FORCE_REFRESH:
            print(f"⏭️  Skipping {role} (Already exists)")
            continue

        print(f"\n✨ Generating questions for: {role}...")
        try:
            # Generate 
            questions = llm.generate_batch_questions(role, num_questions=count, difficulty="Medium")
            
            if questions:
                final_db[role] = questions
                print(f"   ✅ Saved {len(questions)} questions.")
                total_generated += len(questions)
            else:
                print(f"   ⚠️ No questions generated for {role}.")
            
            # Sleep briefly to avoid hitting rate limits too hard if on free tier
            time.sleep(2)
            
        except Exception as e:
            print(f"   ❌ Error generating for {role}: {e}")

    # Write to file
    if final_db:
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(final_db, f, indent=2)
        print(f"\n🏆 SUCCESS! Generated {total_generated} questions across {len(final_db)} roles.")
        print(f"📁 Saved to: {OUTPUT_FILE}")
    else:
        print("\n❌ Failed to generate any questions.")

if __name__ == "__main__":
    generate_database()
