(function(){
  'use strict';

  /**
   * CONCEPT_MAP: Maps 5 high-level concept areas to their module IDs.
   * When adding a new practice module, add its ID to the appropriate concept here.
   */
  var CONCEPT_MAP = {
    '分數': ['fraction-g5', 'fraction-word-g5', 'commercial-pack1-fraction-sprint', 'mixed-multiply'],
    '小數': ['interactive-decimal-g5', 'decimal-unit4'],
    '百分率': ['ratio-percent-g5'],
    '體積': ['volume-g5'],
    '生活應用': ['life-applications-g5']
  };

  /**
   * computeConceptScores - Aggregate module stats into per-concept accuracy.
   * @param {Array<{m:string, n:number, ok:number}>} modules - module breakdown rows
   * @returns {Array<{name:string, score:number, total:number, pct:number}>}
   */
  function computeConceptScores(modules){
    var mods = Array.isArray(modules) ? modules : [];
    var keys = Object.keys(CONCEPT_MAP);
    return keys.map(function(cName){
      var midList = CONCEPT_MAP[cName];
      var total = 0, score = 0;
      mods.forEach(function(m){
        var mName = String(m && m.m || '').toLowerCase();
        for (var i = 0; i < midList.length; i++){
          if (mName.indexOf(midList[i]) >= 0 || midList[i].indexOf(mName) >= 0){
            total += Number(m.n) || 0;
            score += Number(m.ok) || 0;
            break;
          }
        }
      });
      return {
        name: cName,
        score: score,
        total: total,
        pct: total > 0 ? Math.round(score / total * 100) : 0
      };
    });
  }

  /**
   * conceptNames - Returns the ordered list of concept names.
   * @returns {string[]}
   */
  function conceptNames(){
    return Object.keys(CONCEPT_MAP);
  }

  window.AIMathRadarEngine = {
    CONCEPT_MAP: CONCEPT_MAP,
    computeConceptScores: computeConceptScores,
    conceptNames: conceptNames
  };
})();
