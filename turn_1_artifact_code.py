def calculator(operation, num1, num2):
    """
    A simple calculator function that performs basic operations.
    
    Args:
        operation (str): The operation to perform (+, -, *, /)
        num1 (float): First number
        num2 (float): Second number
    
    Returns:
        float: Result of the operation
    """
    if operation == "+":
        return num1 + num2
    elif operation == "-":
        return num1 - num2
    elif operation == "*":
        return num1 * num2
    elif operation == "/":
        if num2 == 0:
            return "Error: Division by zero"
        return num1 / num2
    else:
        return "Error: Invalid operation"

# Example usage
if __name__ == "__main__":
    # Test the calculator with different operations
    print("Simple Calculator Demo")
    print("=" * 20)
    
    # Addition
    result = calculator("+", 10, 5)
    print(f"10 + 5 = {result}")
    
    # Subtraction
    result = calculator("-", 10, 5)
    print(f"10 - 5 = {result}")
    
    # Multiplication
    result = calculator("*", 10, 5)
    print(f"10 * 5 = {result}")
    
    # Division
    result = calculator("/", 10, 5)
    print(f"10 / 5 = {result}")
    
    # Error handling
    result = calculator("/", 10, 0)
    print(f"10 / 0 = {result}")
    
    # Interactive mode
    print("\nInteractive Mode:")
    try:
        num1 = float(input("Enter first number: "))
        operation = input("Enter operation (+, -, *, /): ")
        num2 = float(input("Enter second number: "))
        
        result = calculator(operation, num1, num2)
        print(f"Result: {result}")
    except ValueError:
        print("Invalid input! Please enter numbers only.")