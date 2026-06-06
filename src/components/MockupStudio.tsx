export function MockupStudio() {
  return (
    <div className="min-h-screen p-8 bg-slate-950 text-white">
      <h1 className="text-4xl font-bold mb-6">
        Mockup Studio
      </h1>

      <div className="border border-slate-700 rounded-xl p-6">
        <p>Área de geração de mockups.</p>

        <input
          type="file"
          accept="image/png,image/jpeg"
          className="mt-4"
        />
      </div>
    </div>
  );
}