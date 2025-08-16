import React, { useEffect } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";

const Profile = () => {
  const dispatch = useDispatch();
  

  const fetchUserdata = async () => {
    try {
      await axios.get(
        BASE_URL + "/profile/view",
        {},
        {
          withCredentials: true,
        }
      );

      dispatch(addUser(fetchuser.data));
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    fetchUserdata();
  });

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "48px auto",
        padding: "0 16px",
        fontFamily: "system-ui, sans-serif",
        color: "#e5e7eb",
        background: "#0f172a",
      }}
    >
      {/* Cover */}
      <div
        style={{
          height: "180px",
          borderRadius: "20px",
          background:
            "url('https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1600&auto=format&fit=crop') center/cover no-repeat",
          position: "relative",
        }}
      ></div>

      {/* Profile */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr auto",
          gap: "16px",
          alignItems: "end",
          transform: "translateY(-50%)",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "24px",
            overflow: "hidden",
            border: "3px solid #1f2937",
            background: "#0b1227",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=512&auto=format&fit=crop"
            alt="Avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: "26px" }}>Your Name</h1>
          <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "14px" }}>
            Web Developer • MERN • Next.js
          </p>
          <div style={{ marginTop: "8px", color: "#94a3b8", fontSize: "14px" }}>
            📍 Una, HP, India &nbsp; ✉️ you@example.com
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "6px" }}>
          <button
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              border: "none",
              background: "#22d3ee",
              color: "#0b1227",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Contact
          </button>
          <button
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              border: "1px solid #1f2937",
              background: "#0b1227",
              color: "#e5e7eb",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Download CV
          </button>
        </div>
      </section>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "16px",
          marginTop: "-40px",
        }}
      >
        {/* About + Projects */}
        <main
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            padding: "18px",
            borderRadius: "16px",
          }}
        >
          <h3 style={{ margin: "0 0 12px" }}>About</h3>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>
            I build fast, accessible web apps with a focus on clean UI and great
            DX. Open to internships and freelance work.
          </p>

          <h3 style={{ marginTop: "18px" }}>Projects</h3>
          <div style={{ display: "grid", gap: "10px" }}>
            <div
              style={{
                border: "1px dashed #1f2937",
                padding: "10px",
                borderRadius: "12px",
              }}
            >
              <strong>CalMarshal</strong>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                Calendar scheduling app with real-time sync and custom
                availability.
              </p>
              <div>
                <a href="#" style={{ marginRight: "10px", color: "#22d3ee" }}>
                  Live
                </a>
                <a href="#" style={{ color: "#22d3ee" }}>
                  Code
                </a>
              </div>
            </div>

            <div
              style={{
                border: "1px dashed #1f2937",
                padding: "10px",
                borderRadius: "12px",
              }}
            >
              <strong>Career-Wave</strong>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                Job board platform for seekers and companies.
              </p>
              <div>
                <a href="#" style={{ marginRight: "10px", color: "#22d3ee" }}>
                  Live
                </a>
                <a href="#" style={{ color: "#22d3ee" }}>
                  Code
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* Skills + Links + Contact */}
        <aside
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            padding: "18px",
            borderRadius: "16px",
          }}
        >
          <h3>Skills</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[
              "HTML",
              "CSS",
              "JavaScript",
              "React",
              "Next.js",
              "Node.js",
              "Express",
              "MongoDB",
            ].map((skill) => (
              <span
                key={skill}
                style={{
                  padding: "6px 10px",
                  borderRadius: "999px",
                  border: "1px solid #1f2937",
                  fontSize: "12px",
                }}
              >
                {skill}
              </span>
            ))}
          </div>

          <h3 style={{ marginTop: "18px" }}>Links</h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a href="https://github.com/" style={{ color: "#22d3ee" }}>
              GitHub
            </a>
            <a href="https://linkedin.com/" style={{ color: "#22d3ee" }}>
              LinkedIn
            </a>
            <a href="#" style={{ color: "#22d3ee" }}>
              Portfolio
            </a>
          </div>

          <h3 style={{ marginTop: "18px" }}>Contact</h3>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>
            📞 +91-00000-00000 <br /> 🕒 Open to work
          </p>
        </aside>
      </div>

      <p
        style={{
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "12px",
          padding: "20px 0 10px",
        }}
      >
        © 2025 Your Name
      </p>
    </div>
  );
};

export default Profile;
