import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'Voyager AI — Travel Planner',
  description: 'Generate, edit, and pack for your next trip with an AI travel agent.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-display min-h-screen text-slate-100 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
