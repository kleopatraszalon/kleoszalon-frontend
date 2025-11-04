<div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md text-center">
  <img src={logo} alt="Kleoszalon logó" className="mx-auto mb-6 w-32 h-auto" />

  <h2 className="text-2xl font-semibold text-gray-700 mb-6">Bejelentkezés</h2>

  <form onSubmit={handleSubmit} className="space-y-5">
    <div>
      <input
        type="email"
        placeholder="E-mail cím"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
      />
    </div>

    <div>
      <input
        type="password"
        placeholder="Jelszó"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a373]"
      />
    </div>

    <button
      type="submit"
      className="w-full bg-[#d4a373] text-white py-3 rounded-xl font-medium hover:bg-[#c29260] transition"
    >
      Belépés
    </button>
  </form>

  {/* Itt szúrjuk be a regisztrációs linket */}
  <p className="mt-5 text-sm text-gray-500">
    Még nincs fiókod?{" "}
    <a href="/register" className="text-[#d4a373] hover:underline">
      Regisztráció
    </a>
  </p>
</div>
