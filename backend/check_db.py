
import json
import os

def check():
    path = "data/questions.json"
    if not os.path.exists(path):
        print("❌ File not found!")
        return
        
    with open(path, 'r') as f:
        data = json.load(f)
        
    ds_qs = data.get("Data Scientist", [])
    print(f"✅ Loaded JSON.")
    print(f"📊 'Data Scientist' Count: {len(ds_qs)}")
    
    # Check for duplicates in the list itself
    seen = set()
    dupes = 0
    for q in ds_qs:
        if q['question'] in seen:
            dupes += 1
        seen.add(q['question'])
        
    print(f"⚠️ Internal Duplicates: {dupes}")
    print(f"Sample: {ds_qs[0]['question']}")

if __name__ == "__main__":
    check()
