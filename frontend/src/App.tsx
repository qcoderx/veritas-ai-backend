import React from "react";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import AppRouter from "./AppRouter";
import "./App.css";

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
};

export default App;
