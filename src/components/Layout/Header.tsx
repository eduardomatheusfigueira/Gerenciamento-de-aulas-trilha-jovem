import React from 'react';
import styles from './Header.module.css'; // Import the CSS module

const Header: React.FC = () => {
  return (
    // Apply styles from the CSS module
    <header className={styles.header}> 
      <h1 className={styles.title}>Cronograma de Aulas</h1>
      <p className={styles.subtitle}>Sistema de gerenciamento de oficinas, educadores e turmas</p>
    </header>
  );
};

export default Header;
