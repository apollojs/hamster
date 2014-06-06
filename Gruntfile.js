module.exports = function(grunt) {

  grunt.initConfig({
    pjs: {
      js: {
        src: 'hamster.pjs',
        dest: 'hamster.js'
      }
    },
    clean: {
      js: ['hamster.js']
    }
  });

  grunt.loadNpmTasks('grunt-pjs');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('build', ['clean', 'pjs']);
  grunt.registerTask('default', ['build']);

};
