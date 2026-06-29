import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../../components/ProductCard/ProductCard";
import { searchProducts } from "../../api/productService";

const SearchResults = () => {
  const [params] = useSearchParams();
  const query = params.get("query") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch matching products from the backend (MySQL)
  useEffect(() => {
    let active = true;
    setLoading(true);
    searchProducts(query)
      .then((data) => {
        if (active) setResults(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div className="w-full p-20">
      <h2 className="text-2xl font-bold mb-6">
        Search Results for:{" "}
        <span className="text-orangeBrand">"{query}"</span>
      </h2>

      {loading ? (
        <p className="text-gray-500 text-lg">Searching...</p>
      ) : results.length === 0 ? (
        <p className="text-gray-500 text-lg">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((item) => (
            <ProductCard
              key={`${item.categorySlug}-${item.id}`}
              product={item}
              categorySlug={item.categorySlug}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
