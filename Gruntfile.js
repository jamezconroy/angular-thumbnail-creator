'use strict';

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  require('time-grunt')(grunt);

  var appConfig = {
    app: 'source',
    dist: 'dist'
  };

  grunt.initConfig({

    // Project settings
    thumbgen: appConfig,

    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: {
        src: [
          'Gruntfile.js',
          '<%= thumbgen.app %>/{,*/}*.js'
        ]
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= thumbgen.dist %>/{,*/}*'
          ]
        }]
      }
    },

    // Renames files for browser caching purposes
    filerev: {
      dist: {
        src: [
          '<%= thumbgen.dist %>/{,*/}*.js'
        ]
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= thumbgen.app %>',
          dest: '<%= thumbgen.dist %>',
          src: [
            '*.js', '*.json'
          ]
        }]
      }
    },

    uglify: {
      build: {
        options: {
          mangle: false
        },
        files: {
          'dist/angular-thumbnail-creator.min.js': [ 'dist/**/*.js' ]
        }
      }
    }

  });

  grunt.registerTask('build', [
    'clean:dist',
    'copy:dist',
    'uglify'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
};
