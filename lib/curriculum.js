export const SUBJECTS = {
  math: {
    name: 'Math',
    emoji: '➗',
    units: [
      {
        title: 'Place Value & Decimals',
        concepts: [
          {
            id: 'math-pv-1',
            title: 'Read and compare decimals',
            explanation: 'Decimals show parts of a whole, like slicing a pizza into 10 or 100 pieces. The first place after the decimal point is tenths (1/10), the second is hundredths (1/100), and the third is thousandths (1/1000). To compare decimals, line them up by the decimal point and compare digit by digit from left to right — just like comparing whole numbers.',
            questions: [
              { prompt: 'What digit is in the hundredths place in 3.728?', choices: ['7', '2', '8'], answer: '2' },
              { prompt: 'Which is greater: 0.45 or 0.405?', choices: ['0.45', '0.405', '0.450 — they are the same as 0.45'], answer: '0.45' },
              { prompt: 'Write 0.6 as a fraction in simplest form.', choices: ['6/10', '3/5', '6/100'], answer: '3/5' }
            ]
          },
          {
            id: 'math-pv-2',
            title: 'Multiply and divide by powers of 10',
            explanation: 'When you multiply a number by 10, the decimal point moves one place to the RIGHT (the number gets bigger). When you divide by 10, it moves one place to the LEFT (the number gets smaller). Multiplying by 100 moves it two places right, by 1,000 moves it three places right. Think of it like a conveyor belt — each power of 10 shifts everything over.',
            questions: [
              { prompt: '3.7 × 10 = ?', choices: ['37', '0.37', '370'], answer: '37' },
              { prompt: '450 ÷ 100 = ?', choices: ['45', '4.5', '0.45'], answer: '4.5' },
              { prompt: '0.062 × 1,000 = ?', choices: ['6.2', '62', '620'], answer: '62' }
            ]
          },
          {
            id: 'math-pv-3',
            title: 'Round decimals',
            explanation: 'Rounding means finding the closest "neat" number. Look at the digit to the right of the place you are rounding to. If it is 5 or more, round up. If it is 4 or less, round down. For example, rounding 3.47 to the nearest tenth: look at the 7 (hundredths place), 7 ≥ 5, so round the 4 up to 5 → 3.5.',
            questions: [
              { prompt: 'Round 4.83 to the nearest tenth.', choices: ['4.8', '4.9', '5.0'], answer: '4.8' },
              { prompt: 'Round 12.456 to the nearest hundredth.', choices: ['12.45', '12.46', '12.50'], answer: '12.46' },
              { prompt: 'Round 0.998 to the nearest tenth.', choices: ['0.9', '1.0', '0.10'], answer: '1.0' }
            ]
          },
          {
            id: 'math-pv-4',
            title: 'Add and subtract decimals',
            explanation: 'Line up the decimal points so that tenths are under tenths and hundredths are under hundredths. Add zeros to fill empty places if needed. Then add or subtract just like whole numbers, and bring the decimal point straight down into the answer.',
            questions: [
              { prompt: '3.25 + 1.8 = ?', choices: ['5.05', '4.05', '4.33'], answer: '5.05' },
              { prompt: '10.00 − 3.47 = ?', choices: ['7.53', '6.53', '7.47'], answer: '6.53' },
              { prompt: 'A Publix sub costs $7.49 and a drink costs $1.79. What is the total?', choices: ['$9.28', '$8.28', '$9.18'], answer: '$9.28' }
            ]
          }
        ]
      },
      {
        title: 'Multi-digit Multiplication & Division',
        concepts: [
          {
            id: 'math-md-1',
            title: 'Multiply multi-digit whole numbers',
            explanation: 'Break big multiplication into smaller pieces using place value. For 24 × 16, think: 24 × 10 = 240, and 24 × 6 = 144. Then add: 240 + 144 = 384. This "partial products" method works for any size numbers.',
            questions: [
              { prompt: '32 × 7 = ?', choices: ['204', '224', '214'], answer: '224' },
              { prompt: '24 × 16 = ?', choices: ['364', '384', '394'], answer: '384' },
              { prompt: 'A school orders 45 boxes of supplies with 28 items in each box. How many items total?', choices: ['1,260', '1,160', '1,360'], answer: '1,260' }
            ]
          },
          {
            id: 'math-md-2',
            title: 'Long division with multi-digit divisors',
            explanation: 'Long division breaks a big problem into steps: Divide, Multiply, Subtract, Bring down — then repeat. For 468 ÷ 12, ask: how many 12s fit into 46? Answer: 3 (because 12 × 3 = 36). Subtract 36 from 46, get 10. Bring down the 8 to make 108. How many 12s in 108? Answer: 9 (12 × 9 = 108). So 468 ÷ 12 = 39.',
            questions: [
              { prompt: '96 ÷ 8 = ?', choices: ['11', '12', '13'], answer: '12' },
              { prompt: '468 ÷ 12 = ?', choices: ['36', '39', '42'], answer: '39' },
              { prompt: '1,575 ÷ 25 = ?', choices: ['55', '63', '75'], answer: '63' }
            ]
          },
          {
            id: 'math-md-3',
            title: 'Division with remainders',
            explanation: 'Sometimes a number does not divide evenly. The leftover is called the remainder. For example, 17 ÷ 5 = 3 remainder 2, because 5 × 3 = 15 and 17 − 15 = 2. We write this as 3 R2. In real life, you decide what to do with the remainder — round up if you need a whole container, or express it as a fraction or decimal.',
            questions: [
              { prompt: '23 ÷ 4 = ?', choices: ['5 R3', '5 R2', '6 R1'], answer: '5 R3' },
              { prompt: 'You have 50 stickers to share equally among 8 friends. How many does each friend get, and how many are left over?', choices: ['6 R2', '7 R1', '5 R10'], answer: '6 R2' },
              { prompt: '135 ÷ 16 = ?', choices: ['8 R5', '8 R7', '9 R1'], answer: '8 R7' }
            ]
          }
        ]
      },
      {
        title: 'Fractions (Add, Subtract, Multiply, Divide)',
        concepts: [
          {
            id: 'math-fr-1',
            title: 'Add and subtract fractions with unlike denominators',
            explanation: 'To add or subtract fractions, the denominators (bottom numbers) must match. Find a common denominator by looking for the least common multiple. For 1/2 + 1/3, the LCD is 6: convert to 3/6 + 2/6 = 5/6. Then add the numerators and keep the denominator.',
            questions: [
              { prompt: '1/4 + 2/4 = ?', choices: ['3/4', '3/8', '1/2'], answer: '3/4' },
              { prompt: '1/2 + 1/3 = ?', choices: ['2/5', '5/6', '1/3'], answer: '5/6' },
              { prompt: '5/6 − 1/4 = ?', choices: ['4/2', '7/12', '1/3'], answer: '7/12' }
            ]
          },
          {
            id: 'math-fr-2',
            title: 'Multiply fractions',
            explanation: 'Multiplying fractions is simpler than adding! Multiply the numerators together and multiply the denominators together. For 2/3 × 3/4, do 2 × 3 = 6 on top and 3 × 4 = 12 on the bottom: 6/12 = 1/2. Always simplify your answer. Remember: multiplying by a fraction less than 1 makes the number smaller, not bigger.',
            questions: [
              { prompt: '1/2 × 1/3 = ?', choices: ['1/6', '2/3', '1/5'], answer: '1/6' },
              { prompt: '2/3 × 3/4 = ?', choices: ['6/7', '1/2', '5/12'], answer: '1/2' },
              { prompt: 'A recipe calls for 3/4 cup of sugar, but you want to make half the recipe. How much sugar do you need?', choices: ['3/8 cup', '3/2 cups', '1/4 cup'], answer: '3/8 cup' }
            ]
          },
          {
            id: 'math-fr-3',
            title: 'Divide fractions',
            explanation: 'To divide by a fraction, flip the second fraction (find its reciprocal) and then multiply. The saying is "Keep, Change, Flip." For 1/2 ÷ 1/4, keep 1/2, change ÷ to ×, flip 1/4 to 4/1: 1/2 × 4/1 = 4/2 = 2. This makes sense — how many quarter-cups fit in half a cup? Two!',
            questions: [
              { prompt: '1/2 ÷ 1/4 = ?', choices: ['1/8', '2', '1/4'], answer: '2' },
              { prompt: '3/4 ÷ 1/2 = ?', choices: ['3/8', '1 1/2', '3/2'], answer: '1 1/2' },
              { prompt: 'You have 2/3 of a pizza and you want to split it equally between 2 people. How much does each person get?', choices: ['1/3', '4/3', '2/6'], answer: '1/3' }
            ]
          },
          {
            id: 'math-fr-4',
            title: 'Mixed numbers and improper fractions',
            explanation: 'A mixed number has a whole part and a fraction part, like 2 1/3. An improper fraction has a numerator bigger than its denominator, like 7/3. They mean the same thing! To convert 2 1/3 to improper: 2 × 3 + 1 = 7, so 7/3. To convert 7/3 to mixed: 7 ÷ 3 = 2 remainder 1, so 2 1/3.',
            questions: [
              { prompt: 'Convert 3 1/4 to an improper fraction.', choices: ['13/4', '7/4', '31/4'], answer: '13/4' },
              { prompt: 'Convert 11/5 to a mixed number.', choices: ['2 1/5', '1 6/5', '2 2/5'], answer: '2 1/5' },
              { prompt: '2 1/2 + 1 3/4 = ?', choices: ['3 4/6', '4 1/4', '3 5/4'], answer: '4 1/4' }
            ]
          }
        ]
      },
      {
        title: 'Volume & Measurement',
        concepts: [
          {
            id: 'math-vm-1',
            title: 'Understanding volume',
            explanation: 'Volume is the amount of space inside a 3D shape, measured in cubic units (like cubic centimeters or cubic inches). Think of filling a box with small cubes — the number of cubes that fit inside is the volume. For a rectangular box: Volume = Length × Width × Height.',
            questions: [
              { prompt: 'Volume is measured in...', choices: ['Square units', 'Cubic units', 'Linear units'], answer: 'Cubic units' },
              { prompt: 'What is the volume of a box that is 4 cm long, 3 cm wide, and 2 cm tall?', choices: ['9 cubic cm', '24 cubic cm', '18 cubic cm'], answer: '24 cubic cm' },
              { prompt: 'A fish tank is 20 inches long, 10 inches wide, and 12 inches tall. What is its volume?', choices: ['2,400 cubic in', '240 cubic in', '42 cubic in'], answer: '2,400 cubic in' }
            ]
          },
          {
            id: 'math-vm-2',
            title: 'Volume of composite shapes',
            explanation: 'Some shapes are made of two or more rectangular boxes stuck together. To find the total volume, split the shape into simple rectangles, find each volume separately, and add them up. It is like building with blocks — count the blocks in each section and add.',
            questions: [
              { prompt: 'An L-shaped room is made of two rectangles: one is 5 × 3 × 2 and the other is 4 × 3 × 2. Total volume?', choices: ['54 cubic units', '42 cubic units', '30 cubic units'], answer: '54 cubic units' },
              { prompt: 'To find the volume of a composite shape, you should...', choices: ['Multiply all the dimensions together', 'Break it into simpler shapes and add their volumes', 'Find the area and multiply by 2'], answer: 'Break it into simpler shapes and add their volumes' },
              { prompt: 'A step-shaped box has a bottom section of 6 × 4 × 2 and a top section of 3 × 4 × 2. What is the total volume?', choices: ['72 cubic units', '48 cubic units', '96 cubic units'], answer: '72 cubic units' }
            ]
          },
          {
            id: 'math-vm-3',
            title: 'Converting measurement units',
            explanation: 'Sometimes you need to switch between units — like feet to inches or kilograms to grams. The key is knowing the conversion factor. There are 12 inches in 1 foot, 3 feet in 1 yard, 100 centimeters in 1 meter, and 1,000 grams in 1 kilogram. To convert bigger units to smaller, multiply. To convert smaller to bigger, divide.',
            questions: [
              { prompt: 'How many inches are in 3 feet?', choices: ['30', '36', '24'], answer: '36' },
              { prompt: '5,000 grams = how many kilograms?', choices: ['50', '500', '5'], answer: '5' },
              { prompt: 'The distance from Lakeland to Tampa is about 35 miles. How many feet is that? (1 mile = 5,280 feet)', choices: ['184,800 feet', '18,480 feet', '1,848,000 feet'], answer: '184,800 feet' }
            ]
          }
        ]
      },
      {
        title: 'Coordinate Planes',
        concepts: [
          {
            id: 'math-cp-1',
            title: 'Understanding the coordinate plane',
            explanation: 'A coordinate plane is like a map made of two number lines that cross at a point called the origin (0, 0). The horizontal line is the x-axis (left to right) and the vertical line is the y-axis (bottom to top). Every point on the plane has an address written as (x, y) — first you go across, then up.',
            questions: [
              { prompt: 'The point where the x-axis and y-axis cross is called the...', choices: ['Origin', 'Vertex', 'Midpoint'], answer: 'Origin' },
              { prompt: 'In the ordered pair (3, 7), which number tells you how far to move to the right?', choices: ['7', '3', 'Both'], answer: '3' },
              { prompt: 'What are the coordinates of the origin?', choices: ['(1, 1)', '(0, 0)', '(0, 1)'], answer: '(0, 0)' }
            ]
          },
          {
            id: 'math-cp-2',
            title: 'Plotting and reading ordered pairs',
            explanation: 'To plot a point like (4, 5): start at the origin, move 4 units to the right along the x-axis, then 5 units up. Mark the spot — that is (4, 5). To read a point, reverse the process: see how far right it is (that is x) and how far up (that is y). Remember: x comes first, like the alphabet — x before y!',
            questions: [
              { prompt: 'Which ordered pair is 2 units right and 6 units up from the origin?', choices: ['(6, 2)', '(2, 6)', '(2, 8)'], answer: '(2, 6)' },
              { prompt: 'Point A is at (5, 3) and Point B is at (5, 7). What is different about these points?', choices: ['They are on different horizontal lines', 'They have different y-values (heights)', 'They are on different vertical lines'], answer: 'They have different y-values (heights)' },
              { prompt: 'A treasure map says to start at (0, 0) and walk 8 paces east and 3 paces north. What are the coordinates of the treasure?', choices: ['(3, 8)', '(8, 3)', '(11, 0)'], answer: '(8, 3)' }
            ]
          },
          {
            id: 'math-cp-3',
            title: 'Patterns on a coordinate plane',
            explanation: 'You can graph patterns and rules on a coordinate plane. If a rule says "y is always 2 more than x," you can plot points like (1, 3), (2, 4), (3, 5) — they will form a straight line! This is the beginning of algebra. Spotting the pattern in the coordinates helps you predict new points.',
            questions: [
              { prompt: 'If the rule is "y = x + 3," what is y when x = 4?', choices: ['7', '1', '12'], answer: '7' },
              { prompt: 'Points (1, 2), (2, 4), (3, 6) follow the rule...', choices: ['y = x + 1', 'y = 2x', 'y = x × x'], answer: 'y = 2x' },
              { prompt: 'If you plot (0, 1), (1, 3), (2, 5), (3, 7), the y-value goes up by how much each time?', choices: ['1', '2', '3'], answer: '2' }
            ]
          }
        ]
      },
      {
        title: 'Order of Operations',
        concepts: [
          {
            id: 'math-oo-1',
            title: 'PEMDAS basics',
            explanation: 'When a math problem has more than one operation, you must follow a specific order — otherwise people would get different answers for the same problem! The order is: Parentheses first, then Exponents, then Multiplication and Division (left to right), then Addition and Subtraction (left to right). A fun way to remember: "Please Excuse My Dear Aunt Sally."',
            questions: [
              { prompt: '3 + 4 × 2 = ?', choices: ['14', '11', '10'], answer: '11' },
              { prompt: '(5 + 3) × 2 = ?', choices: ['11', '16', '13'], answer: '16' },
              { prompt: '10 − 2 × 3 + 1 = ?', choices: ['5', '25', '7'], answer: '5' }
            ]
          },
          {
            id: 'math-oo-2',
            title: 'Expressions with grouping symbols',
            explanation: 'Parentheses ( ), brackets [ ], and braces { } all mean "do this part first." When there are groups inside groups, work from the inside out. For example: 2 × [3 + (4 − 1)] → inside first: 4 − 1 = 3, then 3 + 3 = 6, then 2 × 6 = 12.',
            questions: [
              { prompt: '2 × (8 − 3) = ?', choices: ['10', '13', '7'], answer: '10' },
              { prompt: '4 + [2 × (1 + 5)] = ?', choices: ['16', '42', '22'], answer: '16' },
              { prompt: '(6 + 2) ÷ (10 − 6) = ?', choices: ['8', '2', '4'], answer: '2' }
            ]
          },
          {
            id: 'math-oo-3',
            title: 'Writing and interpreting expressions',
            explanation: 'A numerical expression is like a math sentence. "Add 3 and 7, then multiply by 2" becomes (3 + 7) × 2. Being able to translate between words and math is a superpower — it is how you solve word problems. Pay attention to words like "sum" (add), "difference" (subtract), "product" (multiply), and "quotient" (divide).',
            questions: [
              { prompt: '"Multiply the sum of 4 and 6 by 3" as a math expression is...', choices: ['4 + 6 × 3', '(4 + 6) × 3', '4 × 6 + 3'], answer: '(4 + 6) × 3' },
              { prompt: 'What does the expression 2 × (9 − 4) describe in words?', choices: ['Two times nine minus four', 'Twice the difference of 9 and 4', 'Two plus nine minus four'], answer: 'Twice the difference of 9 and 4' },
              { prompt: '"The quotient of 20 and 4" means...', choices: ['20 + 4', '20 × 4', '20 ÷ 4'], answer: '20 ÷ 4' }
            ]
          }
        ]
      },
      {
        title: 'Word Problems & Problem Solving',
        concepts: [
          {
            id: 'math-wp-1',
            title: 'Multi-step word problems',
            explanation: 'Some problems need more than one operation to solve. Read carefully, figure out what is being asked, then plan your steps. It often helps to underline the key numbers and circle the question. Solve one step at a time and check that your final answer actually answers what was asked.',
            questions: [
              { prompt: 'Raleigh earns $5 for each chore she completes. She did 4 chores on Monday and 3 on Tuesday. How much did she earn in total?', choices: ['$30', '$35', '$25'], answer: '$35' },
              { prompt: 'A charity event sells 120 tickets at $8 each and 45 tickets at $12 each. What is the total revenue?', choices: ['$1,500', '$1,380', '$1,500'], answer: '$1,500' },
              { prompt: 'Wesley is driving from Lakeland to Charleston, a 520-mile trip. After 3 hours at 65 mph, how many miles are left?', choices: ['325 miles', '390 miles', '455 miles'], answer: '325 miles' }
            ]
          },
          {
            id: 'math-wp-2',
            title: 'Estimation and reasonableness',
            explanation: 'Before solving a problem, estimate the answer in your head. Round numbers to make the math easier. If your exact answer is way different from your estimate, you probably made a mistake somewhere. Estimation is also useful in real life — when shopping, you can round prices to make sure you have enough money.',
            questions: [
              { prompt: 'Estimate: 48 × 21 is closest to...', choices: ['1,000', '500', '100'], answer: '1,000' },
              { prompt: 'You buy items costing $3.89, $7.12, and $2.95 at Publix. Which is the best estimate of the total?', choices: ['About $14', 'About $10', 'About $20'], answer: 'About $14' },
              { prompt: 'A student says 345 × 12 = 41,400. Is this reasonable?', choices: ['Yes — 350 × 12 = 4,200 so it should be near 4,200', 'Yes — the answer looks about right', 'No — 345 × 10 = 3,450 so 41,400 is way too high'], answer: 'No — 345 × 10 = 3,450 so 41,400 is way too high' }
            ]
          },
          {
            id: 'math-wp-3',
            title: 'Real-world applications',
            explanation: 'Math is everywhere! Budgeting, cooking, planning trips, measuring rooms, comparing deals — these all use math skills you are learning. The key is recognizing which operation to use. "How much altogether?" usually means add or multiply. "How much is left?" means subtract. "How many in each group?" means divide.',
            questions: [
              { prompt: 'A family donates $250 per month to charity. How much do they donate in one year?', choices: ['$2,500', '$3,000', '$2,750'], answer: '$3,000' },
              { prompt: 'Publix has oranges for $0.60 each or a bag of 8 for $4.00. Which is the better deal?', choices: ['Individual oranges — they cost less per orange', 'The bag — each orange costs $0.50', 'They are the same price'], answer: 'The bag — each orange costs $0.50' },
              { prompt: 'You are painting a wall that is 10 feet wide and 8 feet tall. One can of paint covers 50 square feet. How many cans do you need?', choices: ['1 can', '2 cans', '80 cans'], answer: '2 cans' }
            ]
          }
        ]
      }
    ]
  },

  ela: {
    name: 'ELA / Reading',
    emoji: '📚',
    units: [
      {
        title: 'Reading Comprehension (Fiction & Nonfiction)',
        concepts: [
          {
            id: 'ela-rc-1',
            title: 'Find main idea and supporting details',
            explanation: 'The main idea is the most important point the author wants you to understand — it is what the whole passage is about. Supporting details are the facts, examples, and reasons that explain or prove the main idea. A good trick: after reading, ask yourself "What is this mostly about?" That is the main idea.',
            questions: [
              { prompt: 'Read: "Manatees are gentle giants that live in Florida\'s warm waters. They eat sea grass, can grow up to 13 feet long, and are endangered because of boat strikes." What is the main idea?', choices: ['Manatees eat sea grass', 'Manatees are large, gentle animals facing dangers in Florida', 'Boats are dangerous'], answer: 'Manatees are large, gentle animals facing dangers in Florida' },
              { prompt: 'In the manatee passage, which detail SUPPORTS the idea that manatees are "gentle giants"?', choices: ['They are endangered', 'They can grow up to 13 feet long', 'They live in Florida'], answer: 'They can grow up to 13 feet long' },
              { prompt: 'A supporting detail should...', choices: ['Change the topic', 'Explain or prove the main idea', 'Always be an opinion'], answer: 'Explain or prove the main idea' }
            ]
          },
          {
            id: 'ela-rc-2',
            title: 'Making inferences',
            explanation: 'An inference is a smart guess based on clues in the text plus what you already know. The author does not always say everything directly — sometimes you have to read between the lines. If a story says "Maria grabbed her umbrella before leaving," you can infer it is raining or about to rain, even though the text did not say so.',
            questions: [
              { prompt: 'Read: "Jake stared at the empty dog bed and wiped his eyes. He put the leash in a box in the closet." What can you infer?', choices: ['Jake is cleaning his room', 'Jake\'s dog has passed away or been given away', 'Jake is going on a trip'], answer: 'Jake\'s dog has passed away or been given away' },
              { prompt: 'Read: "The audience clapped, and flowers landed on the stage." You can infer that...', choices: ['Someone just finished a great performance', 'A garden is nearby', 'It is a holiday'], answer: 'Someone just finished a great performance' },
              { prompt: 'An inference is different from a fact because it...', choices: ['Is always wrong', 'Comes directly from the text', 'Requires combining clues with your own knowledge'], answer: 'Requires combining clues with your own knowledge' }
            ]
          },
          {
            id: 'ela-rc-3',
            title: 'Comparing fiction and nonfiction',
            explanation: 'Fiction tells made-up stories with characters, settings, and plots. Nonfiction gives real information and facts. They are structured differently: fiction has a beginning, middle, and end with a conflict. Nonfiction often uses headings, facts, and text features like bold words and diagrams. Knowing which type you are reading helps you understand what to look for.',
            questions: [
              { prompt: 'A news article about hurricane season in Florida is an example of...', choices: ['Fiction', 'Nonfiction', 'Poetry'], answer: 'Nonfiction' },
              { prompt: 'Which text feature would you most likely find in nonfiction?', choices: ['Dialogue between characters', 'Headings and subheadings', 'A plot twist'], answer: 'Headings and subheadings' },
              { prompt: 'A story about a girl who discovers a hidden world inside a library is...', choices: ['Nonfiction, because libraries are real', 'Fiction, because the hidden world is made up', 'Both fiction and nonfiction'], answer: 'Fiction, because the hidden world is made up' }
            ]
          }
        ]
      },
      {
        title: 'Vocabulary in Context',
        concepts: [
          {
            id: 'ela-vc-1',
            title: 'Using context clues',
            explanation: 'When you come across a word you do not know, look at the words around it for clues. The sentence might give a definition ("Nocturnal, meaning active at night, animals..."), an example ("Reptiles such as snakes, lizards, and turtles..."), or a contrast ("Unlike her timid sister, Maya was bold"). Context clues are like being a word detective.',
            questions: [
              { prompt: 'Read: "The arid desert gets almost no rainfall all year." What does "arid" most likely mean?', choices: ['Wet', 'Very dry', 'Cold'], answer: 'Very dry' },
              { prompt: 'Read: "Unlike his gregarious brother, Tom preferred to be alone." What does "gregarious" mean?', choices: ['Sociable and outgoing', 'Shy and quiet', 'Angry and mean'], answer: 'Sociable and outgoing' },
              { prompt: 'Read: "The philanthropist donated millions to help build schools and hospitals." What is a philanthropist?', choices: ['A doctor', 'A person who gives generously to help others', 'A teacher'], answer: 'A person who gives generously to help others' }
            ]
          },
          {
            id: 'ela-vc-2',
            title: 'Greek and Latin roots',
            explanation: 'Many English words come from Greek and Latin roots. If you know common roots, you can figure out new words! For example, "bio" means life, so "biology" is the study of life. "Tele" means far, so "telephone" carries sound far away. Learning roots is like getting a master key to hundreds of words.',
            questions: [
              { prompt: 'The root "aqua" means water. What does "aquarium" most likely relate to?', choices: ['Air', 'Water', 'Earth'], answer: 'Water' },
              { prompt: 'The prefix "un-" means "not." What does "unusual" mean?', choices: ['Very usual', 'Not usual', 'Always usual'], answer: 'Not usual' },
              { prompt: 'The root "graph" means to write. Which word means "a person\'s own written name"?', choices: ['Geography', 'Autograph', 'Photograph'], answer: 'Autograph' }
            ]
          },
          {
            id: 'ela-vc-3',
            title: 'Figurative language',
            explanation: 'Figurative language uses words in creative, non-literal ways to paint pictures in your mind. A simile compares using "like" or "as" ("fast as a cheetah"). A metaphor says something IS something else ("time is money"). Personification gives human traits to non-human things ("the wind whispered"). Idioms are expressions that mean something different from their literal words ("it is raining cats and dogs" means raining heavily).',
            questions: [
              { prompt: '"Her smile was as bright as the sun" is an example of...', choices: ['Metaphor', 'Simile', 'Personification'], answer: 'Simile' },
              { prompt: '"The old house groaned in the wind" is an example of...', choices: ['Simile', 'Idiom', 'Personification'], answer: 'Personification' },
              { prompt: '"Break a leg!" before a performance means...', choices: ['Be careful not to fall', 'Good luck!', 'The stage is dangerous'], answer: 'Good luck!' }
            ]
          }
        ]
      },
      {
        title: 'Writing Structure (Paragraphs & Essays)',
        concepts: [
          {
            id: 'ela-ws-1',
            title: 'Paragraph structure',
            explanation: 'A strong paragraph is like a sandwich. The topic sentence is the top bun — it tells the reader what the paragraph is about. The supporting sentences are the filling — they give details, examples, and explanations. The closing sentence is the bottom bun — it wraps up the idea. Every sentence in a paragraph should connect to the topic sentence.',
            questions: [
              { prompt: 'The topic sentence of a paragraph should...', choices: ['Give every detail about the topic', 'Introduce what the paragraph is about', 'End the paragraph'], answer: 'Introduce what the paragraph is about' },
              { prompt: 'A paragraph about your favorite hobby should NOT include a sentence about...', choices: ['Why you enjoy it', 'When you started it', 'What you ate for breakfast'], answer: 'What you ate for breakfast' },
              { prompt: 'A closing sentence should...', choices: ['Introduce a brand new topic', 'Wrap up or summarize the paragraph\'s idea', 'Repeat the topic sentence word for word'], answer: 'Wrap up or summarize the paragraph\'s idea' }
            ]
          },
          {
            id: 'ela-ws-2',
            title: 'Essay organization',
            explanation: 'An essay is a group of paragraphs that work together. It has three main parts: the introduction (hooks the reader and states the main point or thesis), the body paragraphs (each one covers a different reason, example, or detail), and the conclusion (summarizes and leaves the reader with a final thought). Think of it as: tell them what you are going to say, say it, then tell them what you said.',
            questions: [
              { prompt: 'The introduction of an essay should include...', choices: ['Every detail you plan to discuss', 'A hook and your main idea (thesis)', 'Your personal phone number'], answer: 'A hook and your main idea (thesis)' },
              { prompt: 'How many main ideas should each body paragraph cover?', choices: ['As many as possible', 'One main idea', 'None — body paragraphs are just for fun'], answer: 'One main idea' },
              { prompt: 'The conclusion of an essay should...', choices: ['Introduce new information', 'Summarize the main points and leave a final thought', 'Repeat the introduction exactly'], answer: 'Summarize the main points and leave a final thought' }
            ]
          },
          {
            id: 'ela-ws-3',
            title: 'Transition words and phrases',
            explanation: 'Transition words are bridges between ideas. They help your writing flow smoothly from one sentence or paragraph to the next. "First," "Next," and "Finally" show order. "However" and "On the other hand" show contrast. "For example" and "In addition" add information. "Therefore" and "As a result" show cause and effect. Using transitions makes your writing easier to follow.',
            questions: [
              { prompt: 'Which transition word shows CONTRAST?', choices: ['Also', 'However', 'First'], answer: 'However' },
              { prompt: '"Volunteering helps others. _____, it helps you learn new skills." Which transition fits best?', choices: ['However', 'In addition', 'Finally'], answer: 'In addition' },
              { prompt: 'Which transition word best shows cause and effect?', choices: ['Meanwhile', 'Therefore', 'For example'], answer: 'Therefore' }
            ]
          }
        ]
      },
      {
        title: 'Grammar & Mechanics',
        concepts: [
          {
            id: 'ela-gm-1',
            title: 'Parts of speech',
            explanation: 'Every word in a sentence has a job. Nouns name people, places, things, or ideas (girl, Florida, book, freedom). Verbs show action or a state of being (run, think, is). Adjectives describe nouns (tall, blue, three). Adverbs describe verbs, adjectives, or other adverbs (quickly, very, always). Knowing parts of speech helps you build better sentences.',
            questions: [
              { prompt: 'In "The curious cat climbed the tall fence," which word is an adjective?', choices: ['climbed', 'curious', 'cat'], answer: 'curious' },
              { prompt: 'In "She ran quickly to the store," which word is an adverb?', choices: ['ran', 'quickly', 'store'], answer: 'quickly' },
              { prompt: 'Which word is a VERB: "The bright sun shone over the calm lake"?', choices: ['bright', 'sun', 'shone'], answer: 'shone' }
            ]
          },
          {
            id: 'ela-gm-2',
            title: 'Subject-verb agreement',
            explanation: 'The subject and verb in a sentence must match in number. A singular subject (one person or thing) needs a singular verb. A plural subject (more than one) needs a plural verb. "The dog runs" (singular) vs. "The dogs run" (plural). Watch out for tricky subjects like "everyone" (singular!) and "the team" (usually singular).',
            questions: [
              { prompt: 'Which sentence is correct?', choices: ['The birds flies south.', 'The birds fly south.', 'The birds is flying south.'], answer: 'The birds fly south.' },
              { prompt: '"Everyone _____ excited for the field trip." Fill in the blank.', choices: ['are', 'is', 'were'], answer: 'is' },
              { prompt: '"The box of chocolates _____ on the table." Fill in the blank.', choices: ['are', 'is', 'sit'], answer: 'is' }
            ]
          },
          {
            id: 'ela-gm-3',
            title: 'Commas and punctuation',
            explanation: 'Commas tell the reader where to pause. Use a comma: in a list (apples, oranges, and grapes), after an introductory phrase (After school, I play soccer), before a conjunction joining two complete thoughts (I like reading, but my brother prefers sports), and around extra information (My dog, a golden retriever, loves the beach). Getting commas right makes your writing clear.',
            questions: [
              { prompt: 'Where does a comma belong? "After dinner we played board games."', choices: ['After dinner, we played board games.', 'After dinner we, played board games.', 'After, dinner we played board games.'], answer: 'After dinner, we played board games.' },
              { prompt: 'Which sentence uses commas correctly in a list?', choices: ['I packed a towel sunscreen and a book.', 'I packed a towel, sunscreen, and a book.', 'I packed, a towel, sunscreen and a book.'], answer: 'I packed a towel, sunscreen, and a book.' },
              { prompt: 'An apostrophe in "the dog\'s bone" shows...', choices: ['The dog is a bone', 'The bone belongs to the dog', 'There are many dogs'], answer: 'The bone belongs to the dog' }
            ]
          }
        ]
      },
      {
        title: 'Literary Analysis (Theme, Character, Plot)',
        concepts: [
          {
            id: 'ela-la-1',
            title: 'Identifying theme',
            explanation: 'The theme is the big life lesson or message in a story — not the topic, but what the author wants you to learn about that topic. For example, a story about a race might have the theme "hard work beats talent when talent does not work hard." To find the theme, think about what the main character learned or how they changed. Themes are usually universal truths like "kindness matters" or "be true to yourself."',
            questions: [
              { prompt: 'A story about a girl who keeps trying until she wins the spelling bee most likely has the theme...', choices: ['Spelling is important', 'Persistence pays off', 'School is fun'], answer: 'Persistence pays off' },
              { prompt: 'How is theme different from topic?', choices: ['They are the same thing', 'The topic is the subject; the theme is the lesson or message about it', 'The theme is always one word'], answer: 'The topic is the subject; the theme is the lesson or message about it' },
              { prompt: 'Read: "After ignoring his teammates all season, Marcus lost the championship. He realized that no one succeeds alone." The theme is...', choices: ['Basketball is hard', 'Teamwork is essential for success', 'Losing is always bad'], answer: 'Teamwork is essential for success' }
            ]
          },
          {
            id: 'ela-la-2',
            title: 'Character analysis',
            explanation: 'You learn about characters through what they say, what they do, what they think, and what others say about them. Character traits describe WHO they are (brave, curious, impatient). Motivations are WHY they act — what they want or need. Characters who change during the story are called dynamic characters. Look for how a character is different at the end compared to the beginning.',
            questions: [
              { prompt: 'A character who shares her lunch with a new student can be described as...', choices: ['Selfish', 'Generous and kind', 'Careless'], answer: 'Generous and kind' },
              { prompt: 'What is a character\'s motivation?', choices: ['Their favorite color', 'The reason behind their actions', 'How tall they are'], answer: 'The reason behind their actions' },
              { prompt: 'A character who starts the story shy but gives a speech at the end is called...', choices: ['A static character', 'A dynamic character', 'A narrator'], answer: 'A dynamic character' }
            ]
          },
          {
            id: 'ela-la-3',
            title: 'Plot structure',
            explanation: 'Most stories follow a pattern called plot structure. It starts with the exposition (introducing characters and setting), then rising action (the problem builds), climax (the most exciting or turning point), falling action (events after the climax), and resolution (how everything wraps up). Knowing this structure helps you understand and talk about any story.',
            questions: [
              { prompt: 'The climax of a story is...', choices: ['The very beginning', 'The most exciting turning point', 'The part where characters are introduced'], answer: 'The most exciting turning point' },
              { prompt: 'In which part of plot structure do we first meet the characters and learn about the setting?', choices: ['Climax', 'Exposition', 'Resolution'], answer: 'Exposition' },
              { prompt: 'The falling action happens...', choices: ['Before the rising action', 'After the climax', 'Only in nonfiction'], answer: 'After the climax' }
            ]
          }
        ]
      },
      {
        title: 'Research & Information Literacy',
        concepts: [
          {
            id: 'ela-ri-1',
            title: 'Evaluating sources',
            explanation: 'Not all information is equally trustworthy. Ask yourself: Who wrote it? (An expert or a random person?) When was it written? (Is it up to date?) Where was it published? (A university website or a random blog?) Why was it written? (To inform or to sell you something?) Reliable sources include encyclopedias, educational websites (.edu, .gov), and published books by experts.',
            questions: [
              { prompt: 'Which source is most reliable for a school report on Florida wildlife?', choices: ['A random person\'s social media post', 'The Florida Fish and Wildlife Conservation Commission website', 'A YouTube comment'], answer: 'The Florida Fish and Wildlife Conservation Commission website' },
              { prompt: 'A website that ends in .gov is run by...', choices: ['A business trying to sell something', 'A government agency', 'An entertainment company'], answer: 'A government agency' },
              { prompt: 'A primary source is...', choices: ['A textbook summarizing events', 'An original document or firsthand account', 'An encyclopedia article'], answer: 'An original document or firsthand account' }
            ]
          },
          {
            id: 'ela-ri-2',
            title: 'Summarizing and note-taking',
            explanation: 'Summarizing means retelling the most important information in your own words — shorter than the original. Good note-taking helps you remember what you read without copying word for word. Use key words and short phrases, not full sentences. After reading a paragraph, close the book and write down the main point in your own words. If you cannot, read it again!',
            questions: [
              { prompt: 'A good summary should...', choices: ['Copy sentences directly from the text', 'Retell the key points in your own words', 'Include every single detail'], answer: 'Retell the key points in your own words' },
              { prompt: 'When taking notes, you should...', choices: ['Write everything the author says word for word', 'Use key words and short phrases', 'Only write things you already know'], answer: 'Use key words and short phrases' },
              { prompt: 'Paraphrasing means...', choices: ['Copying exactly what someone else wrote', 'Restating ideas in your own words', 'Ignoring the source material'], answer: 'Restating ideas in your own words' }
            ]
          },
          {
            id: 'ela-ri-3',
            title: 'Citing sources and avoiding plagiarism',
            explanation: 'When you use someone else\'s ideas or words, you must give them credit — this is called citing your source. Plagiarism means presenting someone else\'s work as your own, and it is taken very seriously, even in 5th grade. Always tell your reader where your information came from: the author, title, and where you found it.',
            questions: [
              { prompt: 'Plagiarism is...', choices: ['Using your own ideas in a paper', 'Presenting someone else\'s work as your own', 'Reading a book for research'], answer: 'Presenting someone else\'s work as your own' },
              { prompt: 'Why do we cite sources?', choices: ['To make our paper longer', 'To give credit to the original author and let readers check facts', 'Because the teacher said so'], answer: 'To give credit to the original author and let readers check facts' },
              { prompt: 'Which of these is a way to avoid plagiarism?', choices: ['Copy and paste from a website', 'Put information in your own words and cite the source', 'Only use information you made up'], answer: 'Put information in your own words and cite the source' }
            ]
          }
        ]
      }
    ]
  },

  science: {
    name: 'Science',
    emoji: '🔬',
    units: [
      {
        title: 'Matter & Its Interactions',
        concepts: [
          {
            id: 'sci-mat-1',
            title: 'Physical vs. chemical changes',
            explanation: 'Physical changes alter the form or appearance of matter without creating a new substance — you can usually reverse them. Melting ice back into water or crushing a can are physical changes. Chemical changes create entirely new substances with different properties — like burning wood (becomes ash and smoke) or rusting iron. Signs of a chemical change: color change, gas bubbles, heat/light, or a new smell.',
            questions: [
              { prompt: 'Melting ice is a...', choices: ['Physical change', 'Chemical change', 'Both'], answer: 'Physical change' },
              { prompt: 'Rusting iron is a...', choices: ['Physical change', 'Chemical change', 'State change only'], answer: 'Chemical change' },
              { prompt: 'Which of these is a chemical change?', choices: ['Cutting a piece of wood', 'Dissolving sugar in water', 'Baking a cake'], answer: 'Baking a cake' }
            ]
          },
          {
            id: 'sci-mat-2',
            title: 'States of matter and their properties',
            explanation: 'Matter exists in three main states: solid, liquid, and gas. Solids have a definite shape and volume (like a book). Liquids have a definite volume but take the shape of their container (like water in a glass). Gases have no definite shape or volume — they spread out to fill any space (like air in a room). What state matter is in depends on temperature and pressure.',
            questions: [
              { prompt: 'Which state of matter has a definite shape AND a definite volume?', choices: ['Liquid', 'Gas', 'Solid'], answer: 'Solid' },
              { prompt: 'When water boils, it changes from a liquid to a...', choices: ['Solid', 'Gas', 'Plasma'], answer: 'Gas' },
              { prompt: 'A gas takes the shape and volume of its...', choices: ['Neighbor', 'Container', 'Original form'], answer: 'Container' }
            ]
          },
          {
            id: 'sci-mat-3',
            title: 'Mixtures and solutions',
            explanation: 'A mixture is two or more substances combined but not chemically joined — you can usually separate them. Trail mix is a mixture (pick out the parts). A solution is a special mixture where one substance dissolves completely in another, like sugar in water. The substance that dissolves is the solute; the substance it dissolves in is the solvent. You can separate solutions by evaporating the solvent.',
            questions: [
              { prompt: 'Which is an example of a solution?', choices: ['Sand and water', 'Salt water', 'A fruit salad'], answer: 'Salt water' },
              { prompt: 'In salt water, the salt is the...', choices: ['Solvent', 'Solute', 'Mixture'], answer: 'Solute' },
              { prompt: 'How could you separate sand from water?', choices: ['Evaporation', 'Filtering', 'Shaking it harder'], answer: 'Filtering' }
            ]
          }
        ]
      },
      {
        title: 'Ecosystems & Energy Flow',
        concepts: [
          {
            id: 'sci-eco-1',
            title: 'Food chains and food webs',
            explanation: 'A food chain shows how energy passes from one living thing to another. It starts with producers (plants that make their own food using sunlight), then goes to consumers (animals that eat plants or other animals), and ends with decomposers (organisms that break down dead things). A food web is many food chains connected together — because most animals eat more than one thing.',
            questions: [
              { prompt: 'In a food chain, energy starts with...', choices: ['Consumers', 'Producers (plants)', 'Decomposers'], answer: 'Producers (plants)' },
              { prompt: 'In the Florida Everglades, this is a food chain: sun → sawgrass → apple snail → snail kite. What is the apple snail?', choices: ['A producer', 'A primary consumer', 'A decomposer'], answer: 'A primary consumer' },
              { prompt: 'A food web is different from a food chain because it...', choices: ['Shows only one path of energy', 'Shows many connected food chains', 'Does not include producers'], answer: 'Shows many connected food chains' }
            ]
          },
          {
            id: 'sci-eco-2',
            title: 'Energy transfer in ecosystems',
            explanation: 'Energy flows through an ecosystem in one direction: from the sun to producers to consumers. At each step, most energy is used for living (moving, growing, staying warm) and only about 10% gets passed to the next level. That is why there are more plants than herbivores and more herbivores than predators — there is less energy available at each level.',
            questions: [
              { prompt: 'Where does almost all energy in an ecosystem originally come from?', choices: ['Soil', 'Water', 'The sun'], answer: 'The sun' },
              { prompt: 'As energy moves up a food chain, the amount of available energy...', choices: ['Increases', 'Decreases', 'Stays the same'], answer: 'Decreases' },
              { prompt: 'Why are there usually more rabbits than foxes in a meadow?', choices: ['Foxes are shy', 'Rabbits reproduce faster', 'There is less energy available to support top predators'], answer: 'There is less energy available to support top predators' }
            ]
          },
          {
            id: 'sci-eco-3',
            title: 'Human impact on ecosystems',
            explanation: 'Humans affect ecosystems in both harmful and helpful ways. Pollution, deforestation, and overfishing damage habitats and threaten species. But conservation efforts — like creating national parks, cleaning up waterways, and protecting endangered species — can help ecosystems recover. In Florida, programs protect manatees, sea turtles, and the Everglades.',
            questions: [
              { prompt: 'Which human activity harms ocean ecosystems?', choices: ['Planting coral', 'Dumping plastic waste', 'Creating marine reserves'], answer: 'Dumping plastic waste' },
              { prompt: 'Conservation means...', choices: ['Using resources as fast as possible', 'Protecting and preserving natural resources', 'Ignoring environmental problems'], answer: 'Protecting and preserving natural resources' },
              { prompt: 'Florida\'s Everglades restoration project aims to...', choices: ['Build more houses in the wetlands', 'Restore the natural flow of water to protect wildlife', 'Drain the swamps for farming'], answer: 'Restore the natural flow of water to protect wildlife' }
            ]
          }
        ]
      },
      {
        title: "Earth's Systems (Weather, Water Cycle)",
        concepts: [
          {
            id: 'sci-es-1',
            title: 'The water cycle',
            explanation: 'Water is constantly moving and recycling on Earth. The water cycle has four main steps: evaporation (water heats up and becomes water vapor), condensation (water vapor cools and forms clouds), precipitation (water falls as rain, snow, or hail), and collection (water gathers in oceans, lakes, and rivers). Then it starts all over! The same water that exists today has been cycling for billions of years.',
            questions: [
              { prompt: 'When the sun heats water in a lake and it rises as vapor, this is called...', choices: ['Condensation', 'Precipitation', 'Evaporation'], answer: 'Evaporation' },
              { prompt: 'Clouds form during which stage of the water cycle?', choices: ['Evaporation', 'Condensation', 'Collection'], answer: 'Condensation' },
              { prompt: 'Rain, snow, sleet, and hail are all forms of...', choices: ['Evaporation', 'Condensation', 'Precipitation'], answer: 'Precipitation' }
            ]
          },
          {
            id: 'sci-es-2',
            title: 'Weather vs. climate',
            explanation: 'Weather is what is happening in the atmosphere right now — today it might be sunny, tomorrow rainy. Climate is the average weather pattern over a long time (usually 30 years or more). Florida has a subtropical climate (warm and humid most of the year), even though individual days can be cool or stormy. Think of it this way: climate is your wardrobe, weather is what you wear today.',
            questions: [
              { prompt: '"It is 85°F and sunny in Lakeland today" describes the...', choices: ['Climate', 'Weather', 'Season'], answer: 'Weather' },
              { prompt: '"Florida is generally warm and humid year-round" describes the...', choices: ['Weather', 'Climate', 'Forecast'], answer: 'Climate' },
              { prompt: 'Climate is measured over...', choices: ['A single day', 'A week', 'Many years (usually 30+)'], answer: 'Many years (usually 30+)' }
            ]
          },
          {
            id: 'sci-es-3',
            title: "Earth's layers and natural hazards",
            explanation: 'Earth has layers like an egg: the thin crust (the shell), the thick mantle (the white), and the core (the yolk — a hot outer core of liquid metal and a solid inner core). Movements deep in the Earth cause earthquakes and volcanoes. Florida does not have many earthquakes, but it does face hurricanes — powerful storms that form over warm ocean water. Understanding Earth systems helps us prepare for natural hazards.',
            questions: [
              { prompt: 'The thinnest layer of Earth is the...', choices: ['Mantle', 'Core', 'Crust'], answer: 'Crust' },
              { prompt: 'Hurricanes form over...', choices: ['Cold land', 'Warm ocean water', 'Mountain tops'], answer: 'Warm ocean water' },
              { prompt: 'Which is the hottest layer of Earth?', choices: ['Crust', 'Mantle', 'Inner core'], answer: 'Inner core' }
            ]
          }
        ]
      },
      {
        title: 'Space & Astronomy',
        concepts: [
          {
            id: 'sci-sp-1',
            title: "Earth's rotation and revolution",
            explanation: 'Earth spins on its axis like a top — one full spin takes about 24 hours, giving us day and night. At the same time, Earth orbits (revolves around) the sun — one full orbit takes about 365.25 days, which is one year. Earth is also tilted on its axis. This tilt is what causes the seasons: when your part of Earth tilts toward the sun, it is summer; when it tilts away, it is winter.',
            questions: [
              { prompt: 'Day and night are caused by Earth\'s...', choices: ['Revolution around the sun', 'Rotation on its axis', 'Distance from the moon'], answer: 'Rotation on its axis' },
              { prompt: 'One full revolution of Earth around the sun takes about...', choices: ['24 hours', '30 days', '365 days'], answer: '365 days' },
              { prompt: 'Seasons are caused by...', choices: ['Earth\'s distance from the sun', 'The tilt of Earth\'s axis', 'The moon\'s gravity'], answer: 'The tilt of Earth\'s axis' }
            ]
          },
          {
            id: 'sci-sp-2',
            title: 'Moon phases',
            explanation: 'The moon does not make its own light — it reflects sunlight. As the moon orbits Earth (about every 29.5 days), we see different amounts of its lit side. This gives us the phases: new moon (dark), waxing crescent, first quarter (half lit), waxing gibbous, full moon (fully lit), then waning gibbous, third quarter, and waning crescent. "Waxing" means getting bigger; "waning" means getting smaller.',
            questions: [
              { prompt: 'The moon produces light by...', choices: ['Glowing on its own', 'Reflecting sunlight', 'Absorbing starlight'], answer: 'Reflecting sunlight' },
              { prompt: 'A full moon occurs when...', choices: ['The moon is between Earth and the sun', 'Earth is between the sun and the moon', 'The moon is behind the sun'], answer: 'Earth is between the sun and the moon' },
              { prompt: '"Waxing" means the lit part of the moon is...', choices: ['Getting smaller', 'Getting bigger', 'Staying the same'], answer: 'Getting bigger' }
            ]
          },
          {
            id: 'sci-sp-3',
            title: 'Stars, planets, and the solar system',
            explanation: 'Our solar system has eight planets orbiting the sun (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune). The inner planets (Mercury through Mars) are small and rocky. The outer planets (Jupiter through Neptune) are large gas or ice giants. Stars, including our sun, are massive balls of hot gas that produce light and heat through nuclear fusion. Stars look tiny because they are incredibly far away.',
            questions: [
              { prompt: 'How many planets are in our solar system?', choices: ['7', '8', '9'], answer: '8' },
              { prompt: 'Which planet is closest to the sun?', choices: ['Venus', 'Mercury', 'Mars'], answer: 'Mercury' },
              { prompt: 'Stars appear to twinkle because...', choices: ['They are turning on and off', 'Earth\'s atmosphere bends their light', 'They are very small'], answer: 'Earth\'s atmosphere bends their light' }
            ]
          }
        ]
      },
      {
        title: 'Engineering Design Process',
        concepts: [
          {
            id: 'sci-ed-1',
            title: 'Defining problems and constraints',
            explanation: 'The engineering design process starts with clearly defining the problem you want to solve. A good problem statement includes: What need are you addressing? Who is it for? What are the constraints (limits on time, materials, money, size)? For example: "Design a birdhouse that can be built for under $5 using recycled materials and must survive Florida rain." The better you define the problem, the better your solution will be.',
            questions: [
              { prompt: 'The first step in the engineering design process is...', choices: ['Build something right away', 'Define the problem clearly', 'Test your solution'], answer: 'Define the problem clearly' },
              { prompt: 'Constraints are...', choices: ['The goals of the project', 'The limits you must work within (time, cost, materials)', 'The decorations on your design'], answer: 'The limits you must work within (time, cost, materials)' },
              { prompt: 'A good problem statement answers...', choices: ['What, who, and what limits exist', 'Only what color to make it', 'How much fun it will be'], answer: 'What, who, and what limits exist' }
            ]
          },
          {
            id: 'sci-ed-2',
            title: 'Designing and testing solutions',
            explanation: 'After defining the problem, brainstorm multiple solutions — do not just go with your first idea! Sketch designs, then choose the best one to build a prototype (a first version). Test the prototype to see if it actually works. A fair test changes only one thing at a time so you can see what makes a difference. Record your results carefully.',
            questions: [
              { prompt: 'A prototype is...', choices: ['The final perfect product', 'A first version built for testing', 'A drawing of your idea'], answer: 'A first version built for testing' },
              { prompt: 'In a fair test, you should change...', choices: ['Everything at once', 'Only one variable at a time', 'Nothing — just watch'], answer: 'Only one variable at a time' },
              { prompt: 'Why should you brainstorm multiple solutions before building?', choices: ['To waste time', 'Your first idea might not be the best one', 'Teachers require it'], answer: 'Your first idea might not be the best one' }
            ]
          },
          {
            id: 'sci-ed-3',
            title: 'Improving designs through iteration',
            explanation: 'Engineers rarely get it perfect the first time! After testing, they look at what worked and what did not, then improve the design. This cycle of design → test → improve is called iteration. Each round gets you closer to a better solution. Even real products like phones and cars go through many iterations. Failure is not the end — it is information.',
            questions: [
              { prompt: 'Iteration in engineering means...', choices: ['Giving up after the first try', 'Repeating the design-test-improve cycle', 'Copying someone else\'s design'], answer: 'Repeating the design-test-improve cycle' },
              { prompt: 'If your bridge model collapses during testing, what should you do?', choices: ['Quit — it does not work', 'Analyze why it failed and redesign', 'Build the exact same thing again'], answer: 'Analyze why it failed and redesign' },
              { prompt: 'Why is failure useful in engineering?', choices: ['It is not useful', 'It gives you information about what to improve', 'It means you should try a different subject'], answer: 'It gives you information about what to improve' }
            ]
          }
        ]
      }
    ]
  },

  social: {
    name: 'Social Studies',
    emoji: '🗺️',
    units: [
      {
        title: 'Early American History (Colonial → Revolution)',
        concepts: [
          {
            id: 'soc-eh-1',
            title: 'Causes of the American Revolution',
            explanation: 'Before the United States existed, 13 colonies were ruled by Great Britain. Colonists grew frustrated with British taxes (like the Stamp Act and Tea Act) because they had no representatives in the British Parliament to vote on these laws — "No taxation without representation!" Events like the Boston Massacre and Boston Tea Party increased tension until the colonists declared independence on July 4, 1776.',
            questions: [
              { prompt: '"No taxation without representation" means...', choices: ['Nobody should ever pay taxes', 'Colonists wanted a voice in government before being taxed', 'Only tea should be taxed'], answer: 'Colonists wanted a voice in government before being taxed' },
              { prompt: 'The Boston Tea Party was a protest against...', choices: ['High prices at local stores', 'British taxes on tea and other goods', 'Laws about farming'], answer: 'British taxes on tea and other goods' },
              { prompt: 'The Declaration of Independence was signed in...', choices: ['1492', '1776', '1812'], answer: '1776' }
            ]
          },
          {
            id: 'soc-eh-2',
            title: 'Colonial life and the 13 colonies',
            explanation: 'The 13 British colonies were grouped into three regions: New England (Massachusetts, Connecticut, New Hampshire, Rhode Island), Middle (New York, Pennsylvania, New Jersey, Delaware), and Southern (Maryland, Virginia, North Carolina, South Carolina, Georgia). Each region had different geography, climate, and economies. Southern colonies like South Carolina and Georgia relied on farming and, tragically, enslaved labor.',
            questions: [
              { prompt: 'South Carolina was part of which colonial region?', choices: ['New England colonies', 'Middle colonies', 'Southern colonies'], answer: 'Southern colonies' },
              { prompt: 'The Southern colonies\' economy was mostly based on...', choices: ['Fishing and shipbuilding', 'Agriculture and farming', 'Mining and manufacturing'], answer: 'Agriculture and farming' },
              { prompt: 'How many original colonies were there?', choices: ['13', '50', '7'], answer: '13' }
            ]
          },
          {
            id: 'soc-eh-3',
            title: 'Key figures of the Revolution',
            explanation: 'Many people played important roles in the fight for independence. George Washington led the Continental Army and became the first president. Thomas Jefferson wrote the Declaration of Independence. Benjamin Franklin was a diplomat who helped secure French support. Abigail Adams urged her husband John Adams to "remember the ladies" in the new government. These leaders came from different backgrounds but shared a vision for a new nation.',
            questions: [
              { prompt: 'Who was the primary author of the Declaration of Independence?', choices: ['George Washington', 'Thomas Jefferson', 'Benjamin Franklin'], answer: 'Thomas Jefferson' },
              { prompt: 'George Washington\'s role during the Revolution was...', choices: ['Writing the Constitution', 'Commanding the Continental Army', 'Serving as a British spy'], answer: 'Commanding the Continental Army' },
              { prompt: 'Benjamin Franklin helped the American cause by...', choices: ['Leading an army', 'Gaining support from France', 'Inventing the telephone'], answer: 'Gaining support from France' }
            ]
          }
        ]
      },
      {
        title: 'US Government & Civics',
        concepts: [
          {
            id: 'soc-gc-1',
            title: 'Three branches of government',
            explanation: 'The U.S. government is divided into three branches to prevent any one person or group from having too much power. The Legislative Branch (Congress: Senate + House of Representatives) makes laws. The Executive Branch (the President) carries out and enforces laws. The Judicial Branch (the Supreme Court and other courts) interprets laws and decides if they follow the Constitution. This system of "checks and balances" keeps power balanced.',
            questions: [
              { prompt: 'Which branch of government makes laws?', choices: ['Executive', 'Legislative', 'Judicial'], answer: 'Legislative' },
              { prompt: 'The President is the head of the...', choices: ['Legislative Branch', 'Judicial Branch', 'Executive Branch'], answer: 'Executive Branch' },
              { prompt: 'The system that prevents any branch from becoming too powerful is called...', choices: ['Checks and balances', 'Majority rule', 'The election system'], answer: 'Checks and balances' }
            ]
          },
          {
            id: 'soc-gc-2',
            title: 'The Constitution and Bill of Rights',
            explanation: 'The U.S. Constitution, written in 1787, is the supreme law of the land. It sets up how the government works. The Bill of Rights is the first 10 amendments (changes) to the Constitution, added in 1791 to protect individual freedoms. These include freedom of speech, freedom of religion, the right to a fair trial, and more. The Constitution can be amended, but it is intentionally hard to change — to protect it from passing trends.',
            questions: [
              { prompt: 'The Bill of Rights consists of the first...', choices: ['5 amendments', '10 amendments', '20 amendments'], answer: '10 amendments' },
              { prompt: 'Freedom of speech is protected by which amendment?', choices: ['The First Amendment', 'The Second Amendment', 'The Fifth Amendment'], answer: 'The First Amendment' },
              { prompt: 'The Constitution is considered the "supreme law of the land" because...', choices: ['It was written first', 'No other law can override it', 'The President wrote it'], answer: 'No other law can override it' }
            ]
          },
          {
            id: 'soc-gc-3',
            title: 'Rights, responsibilities, and civic participation',
            explanation: 'Being an American citizen comes with both rights (things you are free to do) and responsibilities (things you should do). Rights include voting, free speech, and a fair trial. Responsibilities include following laws, paying taxes, serving on a jury, and staying informed. Getting involved in your community — volunteering, attending town meetings, or writing to elected officials — is how citizens help shape their government.',
            questions: [
              { prompt: 'Which is a RESPONSIBILITY of a citizen?', choices: ['Freedom of speech', 'Following the law', 'Owning property'], answer: 'Following the law' },
              { prompt: 'Volunteering in your community is an example of...', choices: ['Breaking the law', 'Civic participation', 'A government requirement'], answer: 'Civic participation' },
              { prompt: 'At what age can U.S. citizens vote in elections?', choices: ['16', '18', '21'], answer: '18' }
            ]
          }
        ]
      },
      {
        title: 'Geography & Map Skills',
        concepts: [
          {
            id: 'soc-gm-1',
            title: 'Reading maps and using map features',
            explanation: 'Maps are tools that represent real places on a flat surface. Key features include: the compass rose (shows direction — N, S, E, W), the legend or key (explains symbols), and the scale (shows how distance on the map relates to real distance). A political map shows boundaries and cities. A physical map shows landforms like mountains and rivers. Knowing how to read a map is a skill you will use your whole life.',
            questions: [
              { prompt: 'A compass rose on a map shows...', choices: ['The population of cities', 'The four cardinal directions', 'The year the map was made'], answer: 'The four cardinal directions' },
              { prompt: 'A map legend explains...', choices: ['The history of the area', 'What the symbols on the map mean', 'Who made the map'], answer: 'What the symbols on the map mean' },
              { prompt: 'A physical map would be most useful for finding...', choices: ['State capitals', 'Mountain ranges and rivers', 'Population numbers'], answer: 'Mountain ranges and rivers' }
            ]
          },
          {
            id: 'soc-gm-2',
            title: 'US regions and major features',
            explanation: 'The U.S. can be divided into regions: Northeast, Southeast, Midwest, Southwest, and West. Each has unique geography, climate, and culture. Florida (Southeast) is a peninsula surrounded by the Atlantic Ocean and the Gulf of Mexico. South Carolina (also Southeast) has mountains in the west and a coastal plain in the east. Major U.S. features include the Mississippi River, the Rocky Mountains, the Great Lakes, and the Grand Canyon.',
            questions: [
              { prompt: 'Florida is part of which U.S. region?', choices: ['Northeast', 'Southeast', 'Southwest'], answer: 'Southeast' },
              { prompt: 'A peninsula is a piece of land...', choices: ['Surrounded by mountains', 'Surrounded by water on three sides', 'In the middle of a continent'], answer: 'Surrounded by water on three sides' },
              { prompt: 'The longest river in the United States is the...', choices: ['Colorado River', 'Ohio River', 'Mississippi River'], answer: 'Mississippi River' }
            ]
          },
          {
            id: 'soc-gm-3',
            title: 'Latitude and longitude',
            explanation: 'Latitude and longitude are imaginary lines that form a grid on Earth, helping us find exact locations. Lines of latitude run east-west (like a ladder) and measure how far north or south of the equator you are. Lines of longitude run north-south and measure how far east or west of the Prime Meridian you are. Together, they give coordinates like (28°N, 82°W) — which is near Lakeland, Florida!',
            questions: [
              { prompt: 'Lines of latitude run...', choices: ['North to south', 'East to west', 'Diagonally'], answer: 'East to west' },
              { prompt: 'The equator is a line of latitude at...', choices: ['0 degrees', '90 degrees', '180 degrees'], answer: '0 degrees' },
              { prompt: 'Coordinates (28°N, 82°W) describe a location that is...', choices: ['28 degrees north of the equator and 82 degrees west of the Prime Meridian', '28 degrees west and 82 degrees north', '28 miles from the equator'], answer: '28 degrees north of the equator and 82 degrees west of the Prime Meridian' }
            ]
          }
        ]
      },
      {
        title: 'Economics Basics',
        concepts: [
          {
            id: 'soc-ec-1',
            title: 'Supply and demand',
            explanation: 'Supply is how much of a product or service is available. Demand is how much people want it. When demand is high and supply is low, prices go up (think of popular concert tickets). When supply is high and demand is low, prices drop (like winter coats in summer). This push and pull between supply and demand is what determines prices in a free market.',
            questions: [
              { prompt: 'If a new video game is very popular but stores only have a few copies, the price will likely...', choices: ['Go down', 'Go up', 'Stay exactly the same'], answer: 'Go up' },
              { prompt: 'When supply of a product increases but demand stays the same, prices usually...', choices: ['Go up', 'Go down', 'Double'], answer: 'Go down' },
              { prompt: 'Supply and demand together determine the...', choices: ['Color of products', 'Price of goods and services', 'Number of stores in a town'], answer: 'Price of goods and services' }
            ]
          },
          {
            id: 'soc-ec-2',
            title: 'Goods, services, and trade',
            explanation: 'Goods are physical things you can buy (food, clothes, books). Services are actions people do for you (haircuts, teaching, medical care). People and countries specialize in what they are good at and trade for the rest. Florida exports oranges and tourism (a service!). Trade helps everyone get what they need at a lower cost than making everything themselves.',
            questions: [
              { prompt: 'Which is an example of a SERVICE?', choices: ['A bicycle', 'A haircut', 'A textbook'], answer: 'A haircut' },
              { prompt: 'Why do countries trade with each other?', choices: ['To start arguments', 'Because each country can specialize in what it does best', 'Because they have to by law'], answer: 'Because each country can specialize in what it does best' },
              { prompt: 'Florida\'s economy benefits from which major service industry?', choices: ['Coal mining', 'Tourism', 'Automobile manufacturing'], answer: 'Tourism' }
            ]
          },
          {
            id: 'soc-ec-3',
            title: 'Budgeting, saving, and financial literacy',
            explanation: 'A budget is a plan for how to spend and save money. The basic idea: income (money coming in) minus expenses (money going out) equals what you can save. Saving money helps you prepare for emergencies, reach big goals, and avoid debt. Even 5th graders can practice budgeting — if you earn $20, deciding to save $5, spend $10, and donate $5 is a budget!',
            questions: [
              { prompt: 'A budget helps you...', choices: ['Spend all your money immediately', 'Plan how to spend, save, and give your money', 'Avoid earning money'], answer: 'Plan how to spend, save, and give your money' },
              { prompt: 'Raleigh earns $20 from chores. She saves $8, spends $7, and donates $5. How much is left over?', choices: ['$0', '$3', '$5'], answer: '$0' },
              { prompt: 'Why is saving money important?', choices: ['It is not — you should spend everything', 'It helps you prepare for emergencies and reach future goals', 'Banks need your money more than you do'], answer: 'It helps you prepare for emergencies and reach future goals' }
            ]
          },
          {
            id: 'soc-ec-4',
            title: 'Entrepreneurship and business basics',
            explanation: 'An entrepreneur is someone who starts a business to solve a problem or meet a need. They take a risk — investing time and money — hoping their idea will succeed. Entrepreneurs create jobs and contribute to the economy. Many successful businesses started small: a lemonade stand, a lawn mowing service, or an app idea. The key skills are creativity, hard work, and learning from mistakes.',
            questions: [
              { prompt: 'An entrepreneur is someone who...', choices: ['Only works for big companies', 'Starts a business and takes a risk', 'Avoids all risks'], answer: 'Starts a business and takes a risk' },
              { prompt: 'A startup needs customers because...', choices: ['Customers bring revenue (money) to keep the business running', 'It is a rule', 'Customers do all the work'], answer: 'Customers bring revenue (money) to keep the business running' },
              { prompt: 'What makes a business idea good?', choices: ['It is expensive to build', 'It solves a real problem that people have', 'Nobody else has heard of it'], answer: 'It solves a real problem that people have' }
            ]
          }
        ]
      },
      {
        title: 'Current Events & Critical Thinking',
        concepts: [
          {
            id: 'soc-ct-1',
            title: 'Fact vs. opinion',
            explanation: 'A fact is a statement that can be proven true or false with evidence ("Florida became a state in 1845"). An opinion is a personal belief or feeling that cannot be proven ("Florida is the best state to live in"). In news, textbooks, and everyday conversations, it is important to tell the difference. Opinions are not wrong — they just need to be recognized as opinions, not confused with facts.',
            questions: [
              { prompt: 'Which is a FACT?', choices: ['Pizza is the best food', 'The Earth orbits the sun', 'Mondays are the worst day'], answer: 'The Earth orbits the sun' },
              { prompt: 'Which is an OPINION?', choices: ['Water freezes at 32°F', 'The United States has 50 states', 'Science is the most interesting subject'], answer: 'Science is the most interesting subject' },
              { prompt: 'A fact can be...', choices: ['Proven with evidence', 'Changed by feelings', 'Different for each person'], answer: 'Proven with evidence' }
            ]
          },
          {
            id: 'soc-ct-2',
            title: 'Identifying bias in media',
            explanation: 'Bias is when information is presented in a way that favors one side. Every person (and every source) has some bias — the key is recognizing it. Look for: loaded language (emotional words meant to persuade), missing information (what are they NOT telling you?), and who created it (do they benefit from you believing this?). Getting news from multiple sources helps you see the full picture.',
            questions: [
              { prompt: 'A news headline that says "Brilliant Mayor Saves City" shows bias because...', choices: ['It uses neutral language', 'It uses loaded, positive language to shape your opinion', 'All headlines are biased'], answer: 'It uses loaded, positive language to shape your opinion' },
              { prompt: 'The best way to identify bias is to...', choices: ['Only read one source', 'Compare information from multiple sources', 'Believe the first thing you read'], answer: 'Compare information from multiple sources' },
              { prompt: 'A source might be biased if...', choices: ['It presents both sides fairly', 'It only shows one perspective and uses emotional language', 'It includes data and evidence'], answer: 'It only shows one perspective and uses emotional language' }
            ]
          },
          {
            id: 'soc-ct-3',
            title: 'Making informed decisions',
            explanation: 'Critical thinking means not just accepting information at face value, but asking questions. Before forming an opinion: gather evidence from reliable sources, consider different perspectives, and think about what might be missing. This applies to everything from school projects to news stories to big life decisions. Smart decisions are informed decisions — and informed means you did the work to understand all sides.',
            questions: [
              { prompt: 'Before forming an opinion on a topic, you should...', choices: ['Just go with your first feeling', 'Research and consider multiple perspectives', 'Ask one friend and agree with them'], answer: 'Research and consider multiple perspectives' },
              { prompt: 'Critical thinking means...', choices: ['Being critical of everyone', 'Analyzing and evaluating information before believing it', 'Always disagreeing'], answer: 'Analyzing and evaluating information before believing it' },
              { prompt: 'A well-informed decision is one that...', choices: ['Is made quickly without research', 'Is based on evidence and considers different viewpoints', 'Follows what everyone else is doing'], answer: 'Is based on evidence and considers different viewpoints' }
            ]
          }
        ]
      }
    ]
  }
};

export const LEVELS = [
  { name: 'Explorer', min: 0 },
  { name: 'Trailblazer', min: 15 },
  { name: 'Strategist', min: 35 },
  { name: 'Scholar', min: 55 },
  { name: 'Mastermind', min: 75 },
  { name: 'Alpha Achiever', min: 90 }
];

export const BADGE_RULES = [
  { id: 'first-session', title: 'First Session', requirement: 'Complete your first session', matcher: (state) => state.sessionLogs.length >= 1 },
  { id: 'streak-5', title: '5-Day Flame 🔥', requirement: 'Reach a 5-day streak', matcher: (state) => state.streak >= 5 },
  { id: 'streak-10', title: '10-Day Blaze 🔥🔥', requirement: 'Reach a 10-day streak', matcher: (state) => state.streak >= 10 },
  { id: 'math-90', title: 'Math Mastery', requirement: 'Math mastery at 90%+', matcher: (state) => (state.subjects.math?.mastery || 0) >= 90 },
  { id: 'ela-90', title: 'ELA Mastery', requirement: 'ELA mastery at 90%+', matcher: (state) => (state.subjects.ela?.mastery || 0) >= 90 },
  { id: 'science-90', title: 'Science Mastery', requirement: 'Science mastery at 90%+', matcher: (state) => (state.subjects.science?.mastery || 0) >= 90 },
  { id: 'social-90', title: 'Social Studies Mastery', requirement: 'Social Studies mastery at 90%+', matcher: (state) => (state.subjects.social?.mastery || 0) >= 90 },
  { id: 'all-subjects', title: 'Renaissance Scholar', requirement: 'Reach 50%+ mastery in all four subjects', matcher: (state) => ['math', 'ela', 'science', 'social'].every(s => (state.subjects[s]?.mastery || 0) >= 50) },
  { id: 'weekly-hero', title: 'Week Winner', requirement: 'Complete 5/5 days this week', matcher: (state) => state.weeklyCompleted >= 5 },
  { id: 'perfect-session', title: 'Perfect Score', requirement: 'Get every question right in a session', matcher: (state) => state.lastSessionPerfect === true }
];
