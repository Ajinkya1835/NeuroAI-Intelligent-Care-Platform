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

const sensoryModules = [
  {
    slug: 'sensory-learning-and-exploration', order: 2, title: 'Module 2: Sensory Learning and Exploration', area: 'Sensory Learning',
    summary: 'Explore touch, movement, pouring, outdoor noticing, sorting and sensory choices through short supported activities.',
    definitions: [
      ['touch-and-texture', 'Touch and Texture', 'Sensory Exploration', 'Texture matching', 'object', [['apple', ['apple', 'ball', 'star']], ['ball', ['apple', 'ball', 'star']]], 'Let your child touch safe objects with different textures. Name each texture and allow them to choose whether to continue.', 'Your child can explore at their own pace.'],
      ['pour-and-scoop', 'Pour and Scoop', 'Fine Motor', 'Scooping and pouring', 'count', [[1, [1, 2, 3]], [2, [1, 2, 3]], [3, [3, 1, 2]]], 'Use cups, spoons and a tray with dry rice or water. Demonstrate slowly, then let your child scoop and pour.', 'Small repeated movements build control.'],
      ['move-and-play', 'Move and Play', 'Movement', 'Copying safe movements', 'shape', [['circle', ['circle', 'square', 'triangle']], ['square', ['circle', 'square', 'triangle']], ['triangle', ['circle', 'square', 'triangle']]], 'Offer simple actions such as stretch, push, jump or roll. Follow your child’s lead and pause when they show they need a break.', 'Movement should feel safe and fun.'],
      ['sensory-walk', 'Sensory Walk', 'Sensory Awareness', 'Noticing the environment', 'color', [['red', ['red', 'blue', 'yellow']], ['blue', ['red', 'blue', 'yellow']], ['yellow', ['red', 'blue', 'yellow']]], 'Take a short walk and notice one sound, color, texture or movement at a time. Keep the route familiar and optional.', 'Notice without pressure.'],
      ['sort-by-shape', 'Sort by Shape', 'Early Thinking', 'Sorting objects', 'shape', [['circle', ['circle', 'square', 'triangle']], ['square', ['circle', 'square', 'triangle']], ['triangle', ['circle', 'square', 'triangle']]], 'Sort safe household objects by shape. Start with two groups, then add a third when your child is ready.', 'One clear rule at a time makes sorting easier.'],
      ['my-sensory-choices', 'My Sensory Choices', 'Self-Advocacy', 'Choosing what feels comfortable', 'face', [['happy', ['happy', 'sad', 'angry']], ['sad', ['happy', 'sad', 'angry']], ['happy', ['happy', 'sad', 'angry']]], 'Offer two safe options, such as quiet or music, soft or rough, and ask your child to show or point to their choice.', 'A choice or a break is communication.']
    ]
  },
  {
    slug: 'sensory-skills-and-communication', order: 3, title: 'Module 3: Sensory Skills and Communication', area: 'Sensory Communication',
    summary: 'Build sequencing, imitation, visual attention, flexible thinking, tool choice and pretend play.',
    definitions: [
      ['first-next-last', 'First, Next, Last', 'Sequencing', 'Following a short sequence', 'routine', [['wake up', ['wake up', 'eat', 'sleep']], ['eat', ['wake up', 'eat', 'sleep']], ['sleep', ['wake up', 'eat', 'sleep']]], 'Use three familiar actions and say first, next and last while acting them out. Use pictures or gestures when helpful.', 'Predictable steps help communication.'],
      ['choose-the-tool', 'Choose the Tool', 'Functional Communication', 'Choosing a useful tool', 'object', [['apple', ['apple', 'ball', 'star']], ['ball', ['apple', 'ball', 'star']], ['star', ['apple', 'ball', 'star']]], 'Offer two tools for a simple task and let your child point, reach, gesture or use words to choose.', 'The child’s communication does not need to be spoken.'],
      ['copy-the-movement', 'Copy the Movement', 'Imitation', 'Copying actions', 'shape', [['circle', ['circle', 'square', 'triangle']], ['square', ['circle', 'square', 'triangle']], ['triangle', ['circle', 'square', 'triangle']]], 'Use one simple movement at a time. Wait, celebrate attempts and avoid physically forcing imitation.', 'An attempt to copy is meaningful progress.'],
      ['same-or-different', 'Same or Different', 'Thinking Skills', 'Comparing objects', 'color', [['red', ['red', 'blue', 'yellow']], ['blue', ['red', 'blue', 'yellow']], ['yellow', ['red', 'blue', 'yellow']]], 'Place two objects together and ask whether they are the same or different. Accept pointing, gestures or words.', 'Comparison can be shown in many ways.'],
      ['look-and-find', 'Look and Find', 'Visual Attention', 'Finding a target', 'object', [['apple', ['apple', 'ball', 'star']], ['ball', ['apple', 'ball', 'star']], ['star', ['apple', 'ball', 'star']]], 'Name a target and give your child time to scan. Reduce distractions and praise looking, not only the correct answer.', 'Slow looking supports accurate choices.'],
      ['build-and-pretend', 'Build and Pretend', 'Play and Imagination', 'Building and pretend play', 'routine', [['eat', ['eat', 'sleep', 'wake up']], ['sleep', ['eat', 'sleep', 'wake up']], ['wake up', ['eat', 'sleep', 'wake up']]], 'Build something simple with blocks or household items, then act out one pretend action together.', 'There is more than one right way to play.']
    ]
  }
];

function makeAdditionalModule(moduleDefinition) {
  return { ...moduleDefinition, ages: [3, 6], level: 'Beginner', outcomes: moduleDefinition.definitions.map((item) => item[3]), howTo: 'Keep sessions short, follow your child’s signals and offer a break or a different way to participate whenever needed.', chapters: moduleDefinition.definitions.map((item, index) => {
    const [id, title, area, skill, kind, values, teach, takeaway] = item;
    const sheetRows = rows(kind, values);
    return { id: `c${index + 1}`, title: `Chapter ${index + 1}: ${title}`, summary: teach, worksheets: [{ id, title, skill, area, minutes: 8, goal: teach, materials: ['Printed worksheet', 'Safe household objects'], teach, takeaway, sheet: { kind, chapter: index + 1, rows: sheetRows }, items: makeItems(id, sheetRows, { type: kind === 'count' ? 'count' : kind === 'face' ? 'facepick' : kind === 'routine' ? 'choose' : 'match', text: (row) => `Choose the ${String(row.target).toUpperCase()} example` }) }] };
  }) };
}

const directory = path.join(__dirname, 'content', 'teaching');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'early-learning-foundations.json'), JSON.stringify(moduleData, null, 2));
sensoryModules.forEach((moduleDefinition) => fs.writeFileSync(path.join(directory, `${moduleDefinition.slug}.json`), JSON.stringify(makeAdditionalModule(moduleDefinition), null, 2)));
console.log('Wrote content/teaching/early-learning-foundations.json');
