import axios from "axios";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addArticle } from "../utils/articleSlice";
import { BASE_URL } from "../utils/constants";

const Updates = () => {
  const dispatch = useDispatch();
  const article = useSelector((store) => store.article);
  const fetchArticles = async () => {
    try {
      const articles = await axios.get(BASE_URL + "/api/devto", {
        withCredentials: true,
      });

      console.log(articles.data);
      dispatch(addArticle(articles.data));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  if (!article) return null;
  if (article.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <h1 className="text-xl font-semibold text-gray-600">No connections</h1>
      </div>
    );

  return (
  <>
    <div className="min-h-screen bg-gray-900 p-6 space-y-6">
      {article.map((a, id) => (
        <div
          key={id}
          className="flex flex-col sm:flex-row bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden"
        >
          {/* Left side - Image Placeholder */}
          <div className="w-full sm:w-1/3 bg-gray-700 flex items-center justify-center">
                <img src={a.cover_image} alt="cover-Image" />
            
          </div>

          {/* Right side - Content */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-2 hover:text-indigo-400 transition line-clamp-2">
              {a.title}
            </h2>

            {/* Description */}
            <p className="text-gray-300 text-sm mb-4 line-clamp-3">
              {a.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>{a.readable_publish_date}</span>
              <span>💬 {a.comments_count} · ❤️ {a.public_reactions_count}</span>
            </div>

            {/* Button */}
            <div className="mt-4">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg text-center hover:opacity-90 transition"
              >
                Read Article →
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
);

};

export default Updates;
