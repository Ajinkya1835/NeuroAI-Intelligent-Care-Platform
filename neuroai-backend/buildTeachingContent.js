const fs = require('fs');
const path = require('path');

const rows = (kind, values) => values.map(([target, choices]) => ({ target, choices, answer: choices.indexOf(target) }));
const makeItems = (id, rowsForSheet, prompt) => rowsForSheet.map((row, index) => ({ id: `${id}-${index + 1}`, type: prompt.type, prompt: prompt.text(row) }));
const colors = ['red', 'blue', 'yellow'];
const shapes = ['circle', 'square', 'triangle'];
const objects = ['apple', 'ball', 'star'];
const faces = ['happy', 'sad', 'angry'];
const routines = ['wake up', 'brush teeth', 'eat', 'sleep'];

const definitions = [
  { id: 'colors', title: 'Colors Around Me', area: 'Colors', skill: 'Color matching', kind: 'color', minutes: 8, values: [['red', colors], ['blue', ['red', 'blue', 'yellow']], ['yellow', colors]], goal: 'Your child looks at a color, hears its name, and circles the same color.', teach: 'Start with real things. Name red, blue and yellow, then ask your child to circle the matching color.', takeaway: 'Same color means it looks exactly alike.', type: 'match', text: (r) => `Circle the ${r.target} box (target: ${r.target.toUpperCase()})` },
  { id: 'shapes', title: 'Shapes', area: 'Shapes', skill: 'Shape matching', kind: 'shape', minutes: 8, values: [['circle', shapes], ['square', ['circle', 'square', 'triangle']], ['triangle', shapes]], goal: 'Your child recognises a circle, a square and a triangle and circles the matching shape.', teach: 'Show shapes in the room first. Name each one, then ask your child to circle the identical shape.', takeaway: 'Circle: round. Square: four equal sides. Triangle: three sides.', type: 'match', text: (r) => `Circle the ${r.target} (target: ${r.target.toUpperCase()})` },
  { id: 'numbers-1-5', title: 'Numbers 1-5', area: 'Early Math', skill: 'Counting and quantity', kind: 'count', minutes: 10, values: [[1, [2, 1, 3]], [2, [2, 4, 1]], [3, [5, 2, 3]], [4, [4, 1, 5]], [5, [3, 5, 2]]], goal: 'Your child connects the numbers 1 to 5 with the matching number of dots.', teach: 'Count five small objects together. On the sheet, count the dots and circle the box with the same number.', takeaway: 'The last number we count tells us how many there are.', type: 'count', text: (r) => `Circle the box with ${r.target} ${r.target === 1 ? 'dot' : 'dots'}` },
  { id: 'match-the-same', title: 'Match the Same', area: 'Visual Matching', skill: 'Matching identical pictures', kind: 'object', minutes: 8, values: [['apple', objects], ['ball', ['apple', 'ball', 'star']], ['star', objects]], goal: 'Your child looks at a picture and circles the identical one among the choices.', teach: 'Point to the target picture, name it, and slowly scan every choice before selecting the identical picture.', takeaway: 'Look at every picture before choosing.', type: 'match', text: (r) => `Circle the ${r.target} (target: ${r.target.toUpperCase()})` },
  { id: 'my-feelings', title: 'My Feelings', area: 'Emotions', skill: 'Recognising feelings', kind: 'face', minutes: 8, values: [['happy', faces], ['sad', ['happy', 'sad', 'angry']], ['angry', faces]], goal: 'Your child recognises happy, sad and angry faces and circles the matching one.', teach: 'Make each face yourself and name the feeling. Invite your child to match the feeling on the sheet.', takeaway: 'All feelings are okay. Naming them is the first step.', type: 'facepick', text: (r) => `Circle the ${r.target} face (target: ${r.target.toUpperCase()})` },
  { id: 'daily-routine', title: 'My Daily Routine', area: 'Daily Living', skill: 'Recognising routines', kind: 'routine', minutes: 10, values: [['wake up', routines], ['brush teeth', ['wake up', 'brush teeth', 'eat', 'sleep']], ['eat', routines], ['sleep', routines]], goal: 'Your child recognises pictures for familiar daily routines and circles the matching routine.', teach: 'Talk through the day in order: wake up, brush teeth, eat and sleep. Match each routine picture on the sheet.', takeaway: 'Pictures help us know what comes next in the day.', type: 'choose', text: (r) => `Circle the picture for ${r.target.toUpperCase()}` },
];

const moduleData = {
  slug: 'early-learning-foundations', order: 1, title: 'Module 1: Early Learning Foundations', area: 'Early Learning', level: 'Beginner', ages: [3, 6],
  summary: 'Colors, shapes, numbers, matching, feelings and daily routines through short circle-the-same worksheets.',
  outcomes: definitions.map((d) => d.skill),
  howTo: 'Each worksheet takes 5-10 minutes. Sit next to your child in a calm, quiet spot. Praise effort, offer help in small steps and stop while it is still fun.',
  chapters: definitions.map((d, index) => {
    const sheetRows = rows(d.kind, d.values);
    return { id: `c${index + 1}`, title: `Chapter ${index + 1}: ${d.title}`, summary: d.goal, worksheets: [{
      id: d.id, title: d.title, skill: d.skill, area: d.area, minutes: d.minutes, goal: d.goal,
      materials: ['Printed worksheet', 'Pencil or crayon'], teach: d.teach, takeaway: d.takeaway,
      sheet: { kind: d.kind, chapter: index + 1, rows: sheetRows },
      items: makeItems(d.id, sheetRows, { type: d.type, text: d.text })
    }] };
  })
};

const directory = path.join(__dirname, 'content', 'teaching');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'early-learning-foundations.json'), JSON.stringify(moduleData, null, 2));
console.log('Wrote content/teaching/early-learning-foundations.json');
