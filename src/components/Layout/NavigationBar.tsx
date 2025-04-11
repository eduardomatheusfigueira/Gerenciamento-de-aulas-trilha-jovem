import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './NavigationBar.module.css'; // Import CSS Module

// Define the structure for navigation links
interface NavItem {
  path: string;
  label: string;
  icon?: string; // Optional: Add icon name later if needed
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard' },
  { path: '/oficinas', label: 'Oficinas' },
  { path: '/educadores', label: 'Educadores' },
  { path: '/turmas', label: 'Turmas' },
  { path: '/agendamentos', label: 'Agendamentos' },
  { path: '/relatorios', label: 'Relatórios' },
  { path: '/configuracoes', label: 'Configurações' },
];

const NavigationBar: React.FC = () => {
  return (
    // Apply styles from CSS Module
    <nav className={styles.navContainer}> 
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'} 
          // Use CSS Module classes for active/inactive states
          className={({ isActive }) => 
            `${styles.navLink} ${isActive ? styles.activeLink : styles.inactiveLink}`
          }
        >
          {/* Optional: Add icon here later */}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default NavigationBar;
