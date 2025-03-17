const Button = ({ children, onClick, className }) => {
    return (
      <button onClick={onClick} className={`p-2 border rounded ${className}`}>
        {children}
      </button>
    );
  };
  
  export default Button;
  