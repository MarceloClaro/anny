#!/bin/bash
# This script is used to compile the tutorials of the project.

# Retrieve file parent directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export PYTHONPATH=$DIR/src

# Build the Notebook tutorials
rm -r docs/build
mkdir -p docs/build
for nb in tutorials/*.ipynb; do
    jupyter nbconvert --to html --execute "$nb" --output-dir=docs/build
done

# Anonymize the documentation by replacing lines containing '/home' by 'some_path'
echo "Anonymizing documentation..."
find docs/build -type f -name "*.html" -exec sed -i '/\/home/c\some_path' {} +


