import "bootstrap/dist/css/bootstrap.css";
import * as React from "react";
import { State } from "../state";
import { store } from "../browser";
import { hot } from "react-hot-loader";

const setActiveUrl = ({ url }: { url: string }) => {
  store.setActiveUrl(url);
};

const explorerStateReducer = (state, action) => {
  console.log(`State change: ${JSON.stringify(action)}`);
  switch (action.type) {
    case "FETCH_INIT":
      return { ...state, isLoading: true };
    case "FETCH_SUCCESS":
      return { ...state, isLoading: false, data: action.payload };
    case "DATA_UPDATED":
      return { ...state, data: action.payload };
    case "SET_ACTIVE_URL":
      // Nasty side-effect, any better than passing this to component?
      setActiveUrl({ url: action.payload });
      return { ...state };
    default:
      throw Error(`Unknown action type: ${action.type}`);
  }
};

type ExplorerState = {
  data: State;
  isLoading: boolean;
};

const useData: () => ExplorerState & { dispatch: any } = () => {
  const initialState: ExplorerState = {
    isLoading: false,
    data: null,
  };
  const [state, dispatch]: [
    ExplorerState,
    React.Dispatch<any>
  ] = React.useReducer(explorerStateReducer, initialState);

  const fetchData: () => Promise<void> = async () => {
    dispatch({ type: "FETCH_INIT" });
    try {
      const newData = await store.getLocalStorage();
      dispatch({ type: "FETCH_SUCCESS", payload: newData });
    } catch (err) {
      dispatch({ type: "FETCH_ERROR" });
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []); // Does not depend on any state changes so only called once

  const handleDataChange = (newData: State) => {
    dispatch({ type: "DATA_UPDATED", payload: newData });
  };

  // Subscribe to store changes
  React.useEffect(() => {
    const listener = store.subscribeToChanges(handleDataChange);
    return () => store.unsubscribeToChanges(listener);
  });
  return { ...state, dispatch };
};

type ExplorerDataContextType = {
  data: State;
};

type ExplorerDispatchType = {
  dispatch: React.Dispatch<any>;
};

export const ExplorerDataContext = React.createContext(
  null as ExplorerDataContextType
);

export const ExplorerDispatchContext = React.createContext(
  null as ExplorerDispatchType
);

export const ExplorerContextProvider = ({ children }) => {
  const { data, dispatch } = useData();

  return (
    <ExplorerDispatchContext.Provider value={{ dispatch }}>
      <ExplorerDataContext.Provider value={{ data }}>
        {children}
      </ExplorerDataContext.Provider>
    </ExplorerDispatchContext.Provider>
  );
};

export default hot(module)(ExplorerContextProvider);
