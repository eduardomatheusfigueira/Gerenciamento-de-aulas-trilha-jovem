import { Outlet } from 'react-router-dom';
import Header from './components/Layout/Header'; 
import NavigationBar from './components/Layout/NavigationBar'; 
import styles from './App.module.css'; // Import CSS Module

function App() {
  return (
    // Apply styles from CSS Module
    <div className={styles.appContainer}> 
      <Header /> 

      <div className={styles.mainContentWrapper}> 
        <NavigationBar /> 

        <main className={styles.mainArea}> 
          <Outlet /> {/* Routed components will render here */}
        </main>
      </div>

      {/* Placeholders for Modal/Snackbar if needed globally */}
      {/* <Modal /> */}
      {/* <Snackbar /> */}
    </div>
  );
}

export default App;
