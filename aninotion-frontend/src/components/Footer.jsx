import {
  Github,
  Twitter,
  Mail,
  Heart,
  ExternalLink,
  Users,
  BookOpen,
  Film,
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'GitHub',
      icon: Github,
      href: 'https://github.com/mohitahlawat2001/AniNotion',
      color: 'hover:text-gray-800',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      href: 'https://twitter.com/aninotion',
      color: 'hover:text-blue-400',
    },
    {
      name: 'Email',
      icon: Mail,
      href: 'mailto:support@aninotion.com',
      color: 'hover:text-green-500',
    },
  ];

  const quickLinks = [
    {
      name: 'About',
      href: 'https://github.com/mohitahlawat2001/AniNotion#readme',
      icon: Users,
    },
    {
      name: 'API Docs',
      href: 'https://github.com/mohitahlawat2001/AniNotion/blob/main/aninotion-backend/docs/API_V0.5.md',
      icon: BookOpen,
    },
    {
      name: 'Features',
      href: 'https://github.com/mohitahlawat2001/AniNotion#features',
      icon: Film,
    },
  ];

  const legalLinks = [
    {
      name: 'Privacy Policy',
      href: 'https://github.com/mohitahlawat2001/AniNotion/blob/main/PRIVACY.md',
    },
    {
      name: 'Terms of Service',
      href: 'https://github.com/mohitahlawat2001/AniNotion/blob/main/TERMS.md',
    },
    {
      name: 'Cookie Policy',
      href: 'https://github.com/mohitahlawat2001/AniNotion/blob/main/COOKIES.md',
    },
  ];

  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">AniNotion</h3>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              A modern journal application for tracking anime, manga, and media
              consumption. Keep track of your journey through the world of
              entertainment.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-400 ${link.color} transition-colors duration-200`}
                    aria-label={link.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      {link.name}
                      <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Copyright */}
            <div className="flex items-center text-sm text-gray-500 mb-4 md:mb-0">
              <span>© {currentYear} AniNotion. Made with</span>
              <Heart className="w-4 h-4 mx-1 text-red-500 fill-current" />
              <span>by the AniNotion Team</span>
            </div>

            {/* Tech Stack */}
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                React
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Node.js
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                MongoDB
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-cyan-500 rounded-full mr-1"></span>
                TailwindCSS
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
