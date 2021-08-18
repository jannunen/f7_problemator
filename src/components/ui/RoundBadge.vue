   <template>
     <div class="roundbadge" :style="getStyle">
         <div> <slot></slot> </div>
    </div> 
   </template>
   
   <script>
   export default {
       props : {
           borderColor : {
               type : String,
               default : "#000"
           }
       },
       computed : {
           getStyle() {
               return "border-color : "+this.borderColor
           }
       }
   }
   </script>
   
   <style scoped>
       .roundbadge  {
           display: block;
           border-style : solid;
           position : relative;
           width : 32px;
           height : 32px;
           text-align : center;
           border-radius : 18px;
           border-width : 1px;
           background-color:  #fff;
           margin : 2px;

       }
       .roundbadge div {
           display: block;
           font-size : 16px;
           font-weight : bold;
           padding : 5px 4px 4px 4px;

       }
   </style> 