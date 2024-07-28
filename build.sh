#!/bin/bash

rm ./out/*
cp src/index.html out/index.html
tsc

#Explanantion: 
#removes all files from  the out directory
#copies index.html from the src to out directory
#compiles TS files to JS files using the tsc compiler

#make it executable with 'chmod +x build.sh'
#run it using './build.sh'

#reference: tutorials