import React, { useState, useEffect } from "react";
import API from "../../api/axios";

export default function AboutPageCms() {
  const [about, setAbout] = useState(null);

  useEffect(() => {
    API.get("/about/config").then((res) => {
      if (res.data?.data) setAbout(res.data.data);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await API.put("/about/config/general", about);
    alert("✅ About Page Updated!");
  };

  if (!about) return <div className="p-8 text-xs font-bold text-slate-400">Loading About CMS...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-black text-slate-900 mb-6">About Page Content Studio</h1>
      <form onSubmit={handleSave} className="space-y-6 text-xs font-bold text-slate-700">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-3">
          <h3 className="font-black text-sm text-slate-900 mb-2">Hero Section</h3>
          <div>
            <label className="block mb-1">Badge</label>
            <input
              value={about.hero?.badge || ""}
              onChange={(e) => setAbout({ ...about, hero: { ...about.hero, badge: e.target.value } })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1">Heading Prefix</label>
            <input
              value={about.hero?.headingPrefix || ""}
              onChange={(e) => setAbout({ ...about, hero: { ...about.hero, headingPrefix: e.target.value } })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1">Heading Highlight</label>
            <input
              value={about.hero?.headingHighlight || ""}
              onChange={(e) => setAbout({ ...about, hero: { ...about.hero, headingHighlight: e.target.value } })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1">Description</label>
            <textarea
              rows={3}
              value={about.hero?.description || ""}
              onChange={(e) => setAbout({ ...about, hero: { ...about.hero, description: e.target.value } })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
            />
          </div>
        </div>

        <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold">
          Save Settings
        </button>
      </form>
    </div>
  );
}