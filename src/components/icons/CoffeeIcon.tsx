export function CoffeeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M6.5 8.5H16.2C17.3 8.5 18.2 9.4 18.2 10.5V13.2C18.2 16.9 15.2 19.9 11.5 19.9C7.8 19.9 4.8 16.9 4.8 13.2V10.5C4.8 9.4 5.7 8.5 6.8 8.5H6.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M18.2 10.8H19.3C20.8 10.8 22 12 22 13.5C22 15 20.8 16.2 19.3 16.2H17.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.8 21.5H15.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9 3.5C9.9 4.3 9.9 5.3 9 6.1M12 3.5C12.9 4.3 12.9 5.3 12 6.1M15 3.5C15.9 4.3 15.9 5.3 15 6.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
