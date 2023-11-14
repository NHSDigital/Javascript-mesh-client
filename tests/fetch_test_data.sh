for x in {1..10}; do
    MESSAGE="$(wget https://jsonplaceholder.typicode.com/todos/$x)"
done