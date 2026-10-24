export default function Guide() {
  const weeks = [
    ["Week 1 · Welcome", "Meet in person or by phone. Pray together and share why you were baptized."],
    ["Week 2 · Scripture", "Read one Gospel passage together each day. Ask: what does this show me about Jesus?"],
    ["Week 3 · Community", "Join a small group or Sunday gathering together. Introduce them to two people."],
    ["Week 4 · Sharing", "Talk about who in their life might want to hear their story, and pray for them."],
  ];
  return (
    <main>
      <h1>30-day discipleship guide</h1>
      <p className="sub">For the person from your church walking with each newly baptized believer · test content</p>
      {weeks.map(([h, b]) => (
        <div className="card" key={h} style={{ marginBottom: 10 }}>
          <div className="label">{h}</div>
          <p style={{ margin: "4px 0 0" }}>{b}</p>
        </div>
      ))}
    </main>
  );
}
