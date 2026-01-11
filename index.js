const { Bodies, Body, Composite, Engine, Events, Mouse, MouseConstraint, Render, Runner } = Matter;

const rnd = (n) => Math.floor(Math.random() * n);

const targetAspect = 640 / 960; // 維持したい比率 (例: 16:9)

function getDimensions() {
  let width = document.documentElement.clientWidth;
  let height = document.documentElement.clientHeight;
  const currentAspect = width / height;

  if (currentAspect > targetAspect) {
    // 画面が横に長すぎる場合、高さを基準に幅を制限
    width = height * targetAspect;
  } else {
    // 画面が縦に長すぎる場合、幅を基準に高さを制限
    height = width / targetAspect;
  }
  return { width, height };
}

const { width, height } = getDimensions();
const spanX = (n) => { return Math.floor(n * width / 12); }
const spanY = (n) => { return Math.floor(n * height / 12); }

// ボール配列
const balls = [];
// ボールの大きさ
const sizes = [];
let size = spanY(3);
for (let i = 1; i <= 10; i++) {
  const r = Math.sqrt(size);
  const color = `hsl(${i / 10 * 360},90%,50%)`
  sizes.push({ r, color });
  size *= 2;
}

// ボールの大きさを決める 次とその次
const nexts = [0,1];
const next_level = () => {
  const n0 = nexts.shift();
  nexts.push(rnd(sizes.length / 4));
  return n0;
};

// 2点間の距離計算
// const distance = (p1, p2) => {
//   const dx = p1.x - p2.x;
//   const dy = p1.y - p2.y;
//   const len = Math.sqrt(dx * dx + dy * dy);
//   return len;
// };

// ボールとボールの距離を測る関数
const distance = (p1, p2) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}


const drawWorld = (g, bodies) => {
  for (const body of bodies) {
    if (body.label == "Rectangle Body") {
      g.beginPath();
      const v = body.vertices;
      g.moveTo(v[0].x, v[0].y);
      for (let i = 1; i < v.length; i++) {
        g.lineTo(v[i].x, v[i].y);
      }
      g.closePath();
      g.fill();
    } else if (body.label == "Circle Body") {
      const x = body.position.x;
      const y = body.position.y;
      const r = body.circleRadius;
      g.beginPath();
      g.arc(x, y, r, 0, 2 * Math.PI);
      g.closePath();
      g.fill();
    }
  }
}

const engine = Engine.create();
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
    }
});

// 枠をつくる
const world = engine.world;
Composite.add(world, [
    Bodies.rectangle(spanX(0), spanY(6), spanX(2) - spanX(1.5), spanY(12), { isStatic: true }),
    Bodies.rectangle(spanX(12), spanY(6), spanX(2) - spanX(1.5), spanY(12), { isStatic: true }),
    Bodies.rectangle(spanX(6), spanY(0), spanX(12), spanY(2) - spanY(1.5), { isStatic: true }),
    Bodies.rectangle(spanX(6), spanY(12), spanX(12), spanY(2) - spanY(1.5), { isStatic: true })
]);

// add mouse control
const mouse = Mouse.create(render.canvas);
var mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: false
    }
  }
});
Composite.add(world, mouseConstraint);

// ランダムに10個のボールを落とす
for (let i = 0; i < 200; i++) {
  const level = rnd(sizes.length / 4);
  const options = {
    friction: 1,
    frictionAir: 0.03,
    density: .001, // 密度
    restitution: 0.1, // 反発係数
  };
  const w = sizes[level].r;
  const c = Bodies.circle(rnd(width - 20) + 10, rnd(50), w, options)
  c.render.fillStyle = sizes[level].color;
  c.level = level;
  Composite.add(world, c);
  balls.push(c);
}

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// 同じサイズでくっついるボールをグループとしてグループ分けする再帰関数
const check = () => {
  const visited = new Set();
  const groups = [];
  for (const ball of balls) {
    if (visited.has(ball)) continue;
    const group = [];
    const q = [ball];
    while (q.length) {
      const b = q.shift();
      visited.add(b);
      group.push(b);
      for (const b2 of balls) {
        if (visited.has(b2)) continue;
        if (b.level === b2.level && distance(b.position, b2.position) <= b.circleRadius * 2.01) {
          q.push(b2);
          visited.add(b2);
        }
      }
    }
    groups.push(group);
  }

  // ボールの数が5個のグループは削除
  for (const group of groups) {
    if (group.length === 5) {
      for (const b of group) {
        Composite.remove(world, b);
        const index = balls.indexOf(b);
        if (index !== -1) {
          balls.splice(index, 1);
        }
      }
    }
  }
  return groups;
}


setInterval(() => {
  check();
}, 1000);

