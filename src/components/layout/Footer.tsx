
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white mt-auto border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 md:flex md:items-center md:justify-between">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500">
              &copy; {currentYear} Student Leave Central. All rights reserved.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-sm text-gray-500 text-center md:text-right">
              A simple, efficient leave management system for educational institutions
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
