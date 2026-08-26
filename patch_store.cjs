const fs = require('fs');
let code = fs.readFileSync('src/services/transitStore.tsx', 'utf-8');

const regex = /\/\/ Sync User Profile from Firestore[\s\S]*?catch \(err\) \{\s*handleFirestoreError\(err, OperationType\.GET, userDocPath\);\s*\}/;

const replacement = `// Sync User Profile from Firestore
        const userDocPath = \`users/\${user.uid}\`;
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const today = new Date().toISOString().split('T')[0];

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.scoutPoints !== undefined) setScoutPoints(data.scoutPoints);
            if (data.hasOrca !== undefined) setHasOrca(data.hasOrca);
            if (data.foundCacheIds) setFoundCacheIds(data.foundCacheIds);
            if (data.userSwagInventory) setUserSwagInventory(data.userSwagInventory);
            if (data.checkedInEvents) setCheckedInEvents(data.checkedInEvents);

            // Streak Logic
            let streak = data.currentStreak || 0;
            const lastAccess = data.lastAccessDate;
            let needsUpdate = false;

            if (lastAccess !== today) {
              needsUpdate = true;
              if (lastAccess) {
                const lastDate = new Date(lastAccess);
                const todayDate = new Date(today);
                const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays === 1) {
                  streak += 1;
                } else if (diffDays > 1) {
                  streak = 1; // reset streak
                }
              } else {
                streak = 1;
              }
            }
            setCurrentStreak(streak);

            if (needsUpdate) {
              await setDoc(doc(db, 'users', user.uid), {
                ...data,
                currentStreak: streak,
                lastAccessDate: today,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }

          } else {
            // Initial create on Firestore
            await setDoc(doc(db, 'users', user.uid), {
              userId: user.uid,
              displayName: user.displayName || 'Scout Explorer',
              email: user.email || '',
              photoURL: user.photoURL || '',
              scoutPoints: 450,
              hasOrca: true,
              schoolName: 'Garfield High School',
              foundCacheIds: [],
              userSwagInventory: DEFAULT_USER_SWAG_INVENTORY,
              checkedInEvents: [],
              currentStreak: 1,
              lastAccessDate: today,
              updatedAt: new Date().toISOString(),
            });
            setCurrentStreak(1);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, userDocPath);
        }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/services/transitStore.tsx', code);
