const key = "35a232731cd730c67545c64065c6ae363e40e9f0";

async function test(target: string, mode = "auto") {
  const url = `https://api.zenrows.com/v1/?apikey=${key}&url=${encodeURIComponent(target)}&mode=${mode}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
    const text = await res.text();
    console.log(`\n=== ${target} (mode=${mode}) ===`);
    console.log("status:", res.status, "ms:", Date.now() - t0, "bytes:", text.length);
    console.log(text.slice(0, 800).replace(/\s+/g, " "));
  } catch (e) {
    console.log(`=== ${target} ERROR:`, (e as Error).message);
  }
}

async function main() {
  await test("https://m.instagram.com/naval/");
  await test("https://i.instagram.com/api/v1/users/web_profile_info/?username=naval");
}

main();
