import os
import re

def fix_css(content):
    # Fix spaces in selectors
    c = content.strip()
    c = re.sub(r'\s+\.(\w)', lambda m: '.' + m.group(1), c)
    c = re.sub(r'(\w)-\s+(\w)', lambda m: m.group(1) + '-' + m.group(2), c)
    c = re.sub(r':\s+(\w)', lambda m: ':' + m.group(1), c)
    return c

base = '/mnt/ c/Users/Alex/Desktop/AgriculturalJobs/src'.replace(' ', '')

count = 0
for root, dirs, files in os.walk(base):
    for f in files:
        if f.endswith('.css'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as x:
                c = x.read()
            fixed = fix_css(c)
            with open(path, 'w', encoding='utf-8') as x:
                x.write(fixed)
            print('Fixed:', f)
            count += 1

print('Done:', count, 'files')