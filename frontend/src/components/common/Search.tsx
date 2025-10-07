import type { SearchProps } from "../../types";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { setQuery } from "../features/Search/searchSlice";

const Search: React.FC<SearchProps> = () => {
  const dispatch = useAppDispatch();
  const { query } = useAppSelector((state) => state.search);
  return (
    <div>
      <input
        className="border border-gray-600 rounded-lg text-white font-normal p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 bg-gray-800 placeholder-gray-400"
        placeholder="Search claims..."
        value={query}
        onChange={(e) => dispatch(setQuery(e.target.value))}
      />
    </div>
  );
};

export default Search;
