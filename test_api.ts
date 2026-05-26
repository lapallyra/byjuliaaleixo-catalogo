const test = async() => {
    const res = await fetch("http://localhost:3000/api/createPreference", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [] })
    });
    console.log(res.status);
    console.log(await res.text());
}
test();
