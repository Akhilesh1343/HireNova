import pandas as pd
import json
import os

os.makedirs('frontend/src/data', exist_ok=True)

df = pd.read_csv('candidate_ranking.csv')
top60 = df.head(60).to_dict(orient='records')

names = [
    'Sarah Jenkins', 'Alex Rivera', 'David Chen', 'Emily Zhao', 'Marcus Vance',
    'Elena Rostova', 'Michael Chang', 'Priya Sharma', 'Lucas Dubois', 'Jessica Miller',
    'Amir Al-Mansoor', 'Rachel Greene', 'Carlos Mendez', 'Sophia Kowalski', 'Liam O\'Connor',
    'Hanna Lindstrom', 'Kevin Tanaka', 'Amina Diallo', 'James Wilson', 'Olivia Martin',
    'Daniel Kim', 'Chloe Bennett', 'Vikram Patel', 'Isabella Santos', 'Ryan Cooper',
    'Emma Watson', 'Nathan Drake', 'Grace Hopper', 'Arthur Pendelton', 'Maya Lin',
    'Devon Archer', 'Zoe Kravitz', 'Justin Trudeau', 'Natalie Portman', 'Bruce Wayne',
    'Diana Prince', 'Peter Parker', 'Tony Stark', 'Clark Kent', 'Barry Allen',
    'Hal Jordan', 'Arthur Curry', 'Victor Stone', 'Barbara Gordon', 'Oliver Queen',
    'John Stewart', 'Dinah Lance', 'Jonn Jonzz', 'Zatanna Zatara', 'Wally West',
    'Roy Harper', 'Dick Grayson', 'Jason Todd', 'Tim Drake', 'Stephanie Brown',
    'Cassandra Cain', 'Damian Wayne', 'Alfred Pennyworth', 'Lucius Fox', 'Jim Gordon'
]

candidate_records = []
for i, row in enumerate(top60):
    name = names[i] if i < len(names) else f'Candidate {i+1}'
    skills_raw = str(row.get('Matched_Skills', ''))
    matched = [s.strip() for s in skills_raw.split(',') if s.strip() and s.strip() != 'nan']
    
    ats = round(float(row['ATS_Score']), 2)
    similarity = round(float(row['Similarity']), 2)
    skill_score = round(float(row['Skill_Score']), 2)

    if ats >= 40:
        rec = 'Strong Match'
    elif ats >= 30:
        rec = 'Good Match'
    elif ats >= 20:
        rec = 'Moderate Match'
    else:
        rec = 'Low Match'
        
    candidate_records.append({
        'rank': int(row['Rank']),
        'id': str(row['ID']),
        'name': name,
        'email': f"{name.lower().replace(' ', '.').replace('\'', '')}@example.com",
        'category': row['Category'],
        'similarity': similarity,
        'skillScore': skill_score,
        'atsScore': ats,
        'matchedSkills': matched,
        'recommendation': rec,
        'appliedDate': f'2026-09-{(28 - (i % 25)):02d}'
    })

# Also compute full dataset statistics
category_counts = df['Category'].value_counts().to_dict()
score_buckets = {
    '>= 40% (Strong)': int((df['ATS_Score'] >= 40).sum()),
    '30 - 39% (Good)': int(((df['ATS_Score'] >= 30) & (df['ATS_Score'] < 40)).sum()),
    '20 - 29% (Moderate)': int(((df['ATS_Score'] >= 20) & (df['ATS_Score'] < 30)).sum()),
    '10 - 19% (Low)': int(((df['ATS_Score'] >= 10) & (df['ATS_Score'] < 20)).sum()),
    '< 10% (Unmatched)': int((df['ATS_Score'] < 10).sum()),
}

all_required_skills = ['python', 'django', 'flask', 'sql', 'rest api', 'git', 'data structures', 'software development']
skill_frequencies = {}
for s in all_required_skills:
    skill_frequencies[s] = int(df['Matched_Skills'].fillna('').str.contains(s).sum())

stats = {
    'totalResumes': len(df),
    'totalCandidates': len(df),
    'shortlistedCandidates': int((df['ATS_Score'] >= 28.95).sum()), # top 10 from shortlisted_candidates.csv
    'qualifiedCandidates': int((df['ATS_Score'] >= 20.0).sum()),
    'averageAtsScore': round(float(df['ATS_Score'].mean()), 2),
    'averageShortlistedAts': round(float(df[df['ATS_Score'] >= 28.95]['ATS_Score'].mean()), 2),
    'highestAtsScore': round(float(df['ATS_Score'].max()), 2),
    'categoryDistribution': [{'category': k, 'count': v} for k, v in list(category_counts.items())[:12]],
    'scoreDistribution': [{'range': k, 'count': v} for k, v in score_buckets.items()],
    'skillDistribution': [{'skill': k, 'count': v} for k, v in skill_frequencies.items()],
    'requiredSkills': all_required_skills
}

output_data = {
    'stats': stats,
    'candidates': candidate_records
}

with open('frontend/src/data/mockData.json', 'w') as f:
    json.dump(output_data, f, indent=2)

print('Successfully generated frontend/src/data/mockData.json')
