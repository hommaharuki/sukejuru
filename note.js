/*

<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
  </head>
  <body>
  daaaaaaa
  
  要件
  
  webhookはユーザーのIDと開始行の登録のみとする
  DataはID、内容、日にち、トリガーを保存
  
  SORT関数を使用すれば良き
  
  開始行をもとに情報を取得するようにする。

  ID
HWO
DATE
CONTENT
DATETRG
UPDATE
  
  
  _______________________________________________________
  |    line    |     id     |  memo | date | Trigger ID |
  -------------------------------------------------------
  |    1       |     1      |  aaa  | 2/5  | Trigger ID |
  -------------------------------------------------------
  |    2       |     2      |  ddd  | 9/6  | Trigger ID |
  -------------------------------------------------------
  |    3       |     3      |  afa  | 3/4  | Trigger ID |
  -------------------------------------------------------

     主キー        誰        メモ    日付   　何件目か　　　日付のトリガー　　更新日
  ________________________________________________________________________________
  |    id   |   UserId   |  Memo | Date |  DataId    |  Trigger ID |  UpdateDate |
  --------------------------------------------------------------------------------
  |    1    |     1      |  aaa  | 2/5  |     1      |  Trigger ID |     2/6     |
  --------------------------------------------------------------------------------
  |    2    |     2      |  ddd  | 9/6  |     1      |  Trigger ID |     2/8     |
  --------------------------------------------------------------------------------
  |    3    |     1      |  afa  | 3/4  |     2      |  Trigger ID |     2/10    |
  --------------------------------------------------------------------------------


    
  </body>
</html>






*/
