// CFAS Reference Playlist: track data and rendering (static content).
(function(){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const PL=[
 ["Tried & True Reference Material","The audiophile warhorses. Recordings so widely used that experienced listeners have an immediate frame of reference.",[
  ["Time","Pink Floyd","The clock intro is the most famous transient stress test in audio. Every tick should be distinct, placed, and decay naturally."],
  ["Sultans of Swing","Dire Straits","Each band member occupies a specific place on the stage. Knopfler's guitar tone is a midrange litmus test."],
  ["Aja","Steely Dan","Layered complexity that should stay organized at any volume."],
  ["Hotel California (Live)","Eagles","One of the widest-recorded guitar stages in rock. The solo should appear from a defined point in space."]]],
 ["Bass Extension & Control","How deep does the system reach, and is the bass tight or loose? Listen for pitch definition, attack speed, sub-bass below 40 Hz, and woofer-to-sub integration.",[
  ["Flight of the Cosmic Hippo","Béla Fleck & the Flecktones","Victor Wooten's bass goes extraordinarily low with precise pitch. A tight system lets you follow every note."],
  ["Limit To Your Love","James Blake","A famous 40 Hz sub-drop that exposes crossover integration. It should arrive with weight, not boom."],
  ["Angel","Massive Attack","Slow-rolling bass that tests how gracefully the woofer hands off to the sub."]]],
 ["Dynamic Range & Transient Attack","The distance between the softest and loudest moments, and how fast the system responds to sudden change.",[
  ["Keith Don't Go (Live)","Nils Lofgren","The gold standard for acoustic guitar transients. Sharp attacks, natural decay into silence."],
  ["Why So Serious?","Hans Zimmer","Builds from near-silence to enormous orchestral weight. Reveals how a system handles scale."],
  ["Money for Nothing","Dire Straits","The drum machine hits should snap. Compressed dynamics make it flat and lifeless."]]],
 ["Imaging & Soundstage","Can you point to where each performer stands? Width should reach, and ideally pass, the outer edges of the speakers.",[
  ["Three Days Without You (Binaural)","Ottmar Liebert & Luna Negra","Recorded binaural, with instruments placed across a 180° field."],
  ["Bubbles","Yosi Horikawa","Built as an imaging test. Each sound should snap to a specific location."],
  ["Hotel California (Live, MTV 1994)","Eagles","Audience ambience defines the apparent room size."]]],
 ["Separation in a Busy Mix","When everything plays at once, can you still follow each instrument?",[
  ["Jack of Speed","Steely Dan","Layered guitars, keys, and rhythm section should each occupy a distinct lane."],
  ["Aja","Steely Dan","The drum solo should resolve every stroke cleanly."],
  ["Money for Nothing","Dire Straits","Synth bass, rhythm and lead guitar, and vocals all competing."]]],
 ["Vocal & Midrange Realism","The voice lives in roughly 300 Hz–3 kHz, where our ears are most sensitive. Listen for nasality, a cupped-hands quality, or forwardness.",[
  ["Corcovado (Quiet Nights)","Stacey Kent","Any coloration in the 1–3 kHz range is immediately obvious."],
  ["A Case of You","Diana Krall","Solo piano and voice. Upper-register piano decay is a midrange purity test."],
  ["Spanish Harlem","Rebecca Pidgeon","Recorded as an audiophile vocal reference, with a stable, defined vocal image."]]],
 ["Low-Level Detail Retrieval","What survives in the quietest passages: finger noise, breath, reverb tails, room sound.",[
  ["Little Fly","Esperanza Spalding","The space between the notes matters as much as the notes."],
  ["Hallelujah","Jeff Buckley","Recorded in St. Ann's Church, Brooklyn. The room is an instrument."],
  ["Cornfield Chase","Hans Zimmer","Quiet solo piano with subtle ticking. A less-familiar alternative to Time."]]],
 ["PRAT: Pace, Rhythm & Timing","Does the music feel propulsive and locked-in, or does it drag? Partly speaker, partly amplifier.",[
  ["Got to Get You Into My Life","Earth, Wind & Fire","Brass hits and rhythm section should land together with urgency."],
  ["Take Five","The Dave Brubeck Quartet","The 5/4 meter is a timing trap. Good PRAT keeps it natural."],
  ["Billie Jean","Michael Jackson","The bass groove and kick pattern expose timing issues immediately."]]],
 ["Finding the Weaknesses","Listen for what sounds wrong. Each track probes a known coloration: brightness, loose bass, or a veiled midrange.",[
  ["Tin Pan Alley","Stevie Ray Vaughan","Brightness test. Guitar should sing, cymbals should shimmer, not splash."],
  ["Hello","Adele","Sibilance test. Heavy \"s\" and \"t\" content."],
  ["Fast Car","Tracy Chapman","Loose-bass test. The bass line should stay melodic and pitched."],
  ["Teardrop","Massive Attack","Veiled-midrange test. Elizabeth Fraser's voice should float forward."]],true]
];
document.getElementById("plist").innerHTML=PL.map((s,i)=>`<div class="sec"><div><div class="n">${String(i+1).padStart(2,"0")}</div><h3>${esc(s[0])}</h3><p class="why">${esc(s[1])}</p>${s[3]?'<span class="diag">Diagnostic</span>':""}</div>
<ol class="tracks">${s[2].map((t,j)=>`<li class="${j===0||(s[3]&&j>=2)?"anchor":""}"><span class="k">${j===0||(s[3]&&j>=2)?"★":j+1}</span><div><strong>${esc(t[0])}</strong> <em>· ${esc(t[1])}</em><small>${esc(t[2])}</small></div></li>`).join("")}</ol></div>`).join("");
document.getElementById("anchorsOnly").onchange=e=>document.getElementById("plist").classList.toggle("only-anchors",e.target.checked);
})();
