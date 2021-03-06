var moment = Moment.load(); //moment = Moment.js(時間関係のライブラリ)を使えるように宣言。

// row = 行
// col = 列
// API の呼び出しは減らせば減らすだけ処理が速くなる。

function doPost(e) { //値を外部から受け取った時に反応する関数。
  var webhookData = JSON.parse(e.postData.contents).events[0]; //JSON データ形式 読み込んだJSON文字列を読み込み使う。
  //e.postData.contents >> POST bodyのcontent textを返す。 つまりテキストデータを抜き出す。 events[0] 配列で読み込んでいる？
  //書き方が少しC言語に似ている部分がある。
  // JSON確認。
  // console.log(JSON.parse(e.postData.contents).events[0]);
  //topost,toget系はデータをユーザーに返す。

  var lock = LockService.getScriptLock();
  var message, replyToken, replyText, userId;
  var writingFlag = false;
  /**** 
  var無しでも使えるがグローバル変数にしたくない時にはきちんと宣言したほうがいい。グローバル変数になる。
  変数宣言
  message = text形式のメッセージを取得
  replyToken = トークン取得
  replyText = テキストを返す為。
  userId = どの相手に返信するか把握する為にIDを取得
  writingFlag = 書き込み用のフラグ
  ***/
  message = webhookData.message.text;//text形式のメッセージを取得。
  //console.log(message);
  replyToken = webhookData.replyToken;//返信用のトークンを取得 トークン...場所を記す為の印のようなもの。
  userId = webhookData.source.userId;//どの相手に返信するか把握する為にIDを取得。

  try {
    //30秒間のロックを取得
    lock.waitLock(30000);

    //IDを使い検索用データを整える
    var insertionUserDataRow = ToPSheet(userId);
    //console.log(userId);
    ///////////////////////selectQuery(1);
    // resultのシートが整った
    // IDを返すので +1する
    //  var insertionUserDataRow = insertSearchUseridRowNum() + 1;
    // console.log("RC49:"+insertionUserDataRow);


    // DATEが登録されているかどうかの確認
    // もし同じときにはCONTENTを登録、違うときにはDATEを登録
    if (searchContent() == searchDate()) {
      writingFlag = true;
    }


    // console.log("RC45:"+writingFlag);


    var updateRow;


    /*
      var userDataRow = searchUserDataRow(userId);//何行目にuserIdが入っていたかを判断 代入。
      
      var todo = getTodoCell(userDataRow).getValue();//TodoCellの中身を代入。 userDataRow = 何行目の内容か。  
      var todoDate = getDateCell(userDataRow).getValue(); //Dateセルの中身を代入。
      */

    //  console.log("CR66:"+searchCheckUserDataRow(userId));
    //  console.log("CR67:"+userId);

    // Bセルに値が入っているか確認
    var checkSelectRow;

    checkSelectRow = searchCheckUserDataRow(userId, 0);

    if (searchCheckUserDataRow(userId, 1)) {
      // Bが入っている日付1が入っている 予定を送る 無駄なデータを削除
      // 


      if (ConfirmationDateConfirmation(checkSelectRow)) {

        var deleteCheck = getSellCeeckSchedule(checkSelectRow, 3);

        var plansDate = ConfirmationDateConfirmation(checkSelectRow); // 日付入る もともと登録されている日付
        replyText = ReturnDateVerification(plansDate, message, checkSelectRow, deleteCheck);



      }
      //Bが入っている日付１が入っていない 日付登録
      else {
        replyText = setDateVerification(checkSelectRow + 1, message);

      }

      return sendLineMessageFromReplyToken(replyToken, replyText); //反応してラインに値を送る関数に引数を与える。
    }

    if (checkSelectRow) {
      replyText = getValuesIDResult();
      replyText.shift();

      // 削除にチェックが付いているかの確認 1があったら削除項目
      var deleteCheck = getSellCeeckSchedule(checkSelectRow, 3);

      var replyTextInt = replyText.length;

      // 削除のとき
      if (deleteCheck == 1) {
        if (!(message.match(/[1-6１-６]/))) {
          replyText = "なにをするか数字で送ってね。\n１．予定を表示\n２．最近追加した予定を削除\n３．全ての予定を削除\n４．今週の予定を削除\n５．日付から削除\n６．削除しない";

        }
        else if (replyTextInt == 0) {

          replyText = "削除できる予定がないよ"

        } else {
          console.log("aaaaaa");
          switch (message) {
            // 予定全てを送る
            case '1':
            case '１':
              // replyText = getValuesIDResult();
              // replyText.shift();


              var LineReplyText = "予定を表示するよ\n";


              replyText.forEach(function (value) {

                LineReplyText += Moment.moment(value[2]).format('YYYY年MM月DD日');
                LineReplyText += Moment.moment(value[3]).format('H時m分');
                LineReplyText += ":";
                LineReplyText += value[4];
                LineReplyText += "\n";
              });

              replyText = LineReplyText;


              break;
            // 最新予定削除
            case '2':
            case '２':
              var LineReplyText = "最近追加した予定を削除したよ\n";
              var maxid = getMAXidtoIDResult();
              console.log(maxid);
              getDeleteCellCheckSchedule(checkSelectRow + 1);
              getDeleteCellWbhook(maxid + 1);
              replyText = LineReplyText;

              break;
            // 全ての予定を削除
            case '3':
            case '３':

              var LineReplyText = "全ての予定を削除したよ\n";

              console.log(LineReplyText);
              DeleteAll();

              replyText = LineReplyText;
              getDeleteCellCheckSchedule(checkSelectRow + 1);

              break;
            // 今週の予定を確認
            case '4':
            case '４':
              var LineReplyText = "今週の予定を削除したよ\n";
              var Ver;
              var Ddate;
              // 行を確認、IDを取得 もしIFに引っかかったらそのIDの行を削除
              replyText.forEach(function (value) {

                Ver = Moment.moment(value[2]).format('YYYY年MM月DD日');
                Ddate = Moment.moment().format('YYYY年MM月DD日');
                Ddate = Moment.moment(Ddate, 'YYYY年MM月DD日').add(7, 'days').format('YYYY年MM月DD日');
                if (Moment.moment(Ver, 'YYYY年MM月DD日') < Moment.moment(Ddate, 'YYYY年MM月DD日')) {

                  resultDelete(value[0] + 1);

                }

              });

              replyText = LineReplyText;
              getDeleteCellCheckSchedule(checkSelectRow + 1);

              break;
            // 日付を選択して確認
            case '5':
            case '５':
              replyText = "削除したい日付のはじまりを入力してね";
              SelectToCheckScheduleSheet(userId, checkSelectRow + 1, 2);

              break;
            // 
            case '6':
            case '６':
              replyText = "わかったよ...";
              getDeleteCellCheckSchedule(checkSelectRow + 1);
              break;

          }

        }

      } else { // 削除以外のとき
        if (!(message.match(/[1-5１-５]/))) {
          replyText = "いつの予定を確認するか数字で送ってね。\n１．すべての予定を確認\n２．本日の予定を確認\n３．今週の予定を確認\n４．今月の予定を確認\n５．日付を選択して確認"

        }
        else if (replyTextInt == 0) {

          replyText = "予定がないよ"

        } else {
          switch (message) {
            // 予定全てを送る
            case '1':
            case '１':
              // replyText = getValuesIDResult();
              // replyText.shift();


              var LineReplyText = "全ての予定を確認するよ\n";


              replyText.forEach(function (value) {

                LineReplyText += Moment.moment(value[2]).format('YYYY年MM月DD日');
                LineReplyText += Moment.moment(value[3]).format('H時m分');
                LineReplyText += ":";
                LineReplyText += value[4];
                LineReplyText += "\n";
              });

              replyText = LineReplyText;
              getDeleteCellCheckSchedule(checkSelectRow + 1);

              break;
            // 本日の予定を確認
            case '2':
            case '２':
              var LineReplyText = "今日の予定を確認するよ\n";
              var Ver;
              var Ddate;
              replyText.forEach(function (value) {

                Ver = Moment.moment(value[2]).format('YYYY年MM月DD日');
                Ddate = Moment.moment().format('YYYY年MM月DD日');

                if (Ver == Ddate) {
                  LineReplyText += Ver + Moment.moment(value[3]).format('H時m分');
                  LineReplyText += ":";
                  LineReplyText += value[4];
                  LineReplyText += "\n";
                }

              });

              if (LineReplyText == "今日の予定を確認するよ\n") {
                LineReplyText = "予定はないよ";
              }
              replyText = LineReplyText;
              getDeleteCellCheckSchedule(checkSelectRow + 1);

              break;
            // 今週の予定を確認
            // 時間で比べる
            case '3':
            case '３':
              var LineReplyText = "今週の予定を確認するよ\n";
              var Ver;
              var Ddate;
              replyText.forEach(function (value) {

                Ver = Moment.moment(value[2]).format('YYYY年MM月DD日');
                Ddate = Moment.moment().format('YYYY年MM月DD日');
                Ddate = Moment.moment(Ddate, 'YYYY年MM月DD日').add(7, 'days').format('YYYY年MM月DD日');
                if (Moment.moment(Ver, 'YYYY年MM月DD日') < Moment.moment(Ddate, 'YYYY年MM月DD日')) {
                  LineReplyText += Ver + Moment.moment(value[3]).format('H時m分');
                  LineReplyText += ":";
                  LineReplyText += value[4];
                  LineReplyText += "\n";
                }

              });

              if (LineReplyText == "今週の予定を確認するよ\n") {
                LineReplyText = "予定はないよ";
              }
              replyText = LineReplyText;
              getDeleteCellCheckSchedule(checkSelectRow + 1);

              break;
            // 今月の予定を確認
            case '4':
            case '４':
              var LineReplyText = "今月の予定を確認するよ\n";
              var Ver;
              var Ddate;
              replyText.forEach(function (value) {

                Ver = Moment.moment(value[2]).format('YYYY年MM月');

                Ddate = Moment.moment().format('YYYY年MM月');
                if (Ver == Ddate) {
                  Ver = Moment.moment(value[2]).format('YYYY年MM月DD日');
                  LineReplyText += Ver + Moment.moment(value[3]).format('H時m分');
                  LineReplyText += ":";
                  LineReplyText += value[4];
                  LineReplyText += "\n";
                }

              });
              // 値が同じ時 何も値が入っていないため予定なし
              if (LineReplyText == "今月の予定を確認するよ\n") {
                LineReplyText = "予定はないよ";
              }
              replyText = LineReplyText;
              getDeleteCellCheckSchedule(checkSelectRow + 1);

              break;
            // 日付を選択して確認
            case '5':
            case '５':
              replyText = "確認したい日付のはじまりを入力してね";
              SelectToCheckScheduleSheet(userId, checkSelectRow + 1, 2);

              break;
            // 

          }

        }
      }


      return sendLineMessageFromReplyToken(replyToken, replyText); //反応してラインに値を送る関数に引数を与える。
    }

    //  console.log(message);
    switch (message) {
      case '使い方':
        replyText = 'あとで思い出したいことをラインしてくれれば、いつお知らせしてほしいか聞くよ\nまずは覚えて欲しいことを教えてね\nその後時間を聞くから「10分後」「11月11日11時11分」のように「○分後」か、「○月○日○時○分」形式で日時を教えてね！そうしないと正しく時間を登録できないよ！';
        break;
      // キャンセル処理へ移行
      // 変更
      case '予定削除':
        replyText = "なにをするか数字で送ってね。\n１．予定を確認\n２．最近追加した予定を削除\n３．全ての予定を削除\n４．IDを選択して削除\n５．日付から削除\n６．削除しない";
        appendToDeleteCheckScheduleSheet(userId); //userIdをレコードの最後に追加。  
        //      replyText = canceldata(insertionUserDataRow);

        break;
      case '予定確認':
        // HWOにUserIDを追加

        replyText = "いつの予定を確認するか数字で送ってね。\n１．すべての予定を確認\n２．本日の予定を確認\n３．今週の予定を確認\n４．今月の予定を確認\n５．日付を選択して確認"
        appendToCheckScheduleSheet(userId); //userIdをレコードの最後に追加。

        // if (todoDate) {
        //   replyText = '「' + todo + '」を' + todoDate + 'に知らせるよ！';
        // } else {
        //   replyText = '何も登録されていないよ！';
        // }
        break;
      default: //何か登録したいものが送られてきた場合の登録の場合分け。
        /* if (todoDate) { //すでにリマインダーが登録がされている状態で新しい予定が入ってきた場合。 todoDateが空でない場合。
           replyText = '一つ登録されているよ！\nもし新しい予定を登録したい時には”キャンセル”って送ってね。';
         } else if (todo) { //すでにタスクが登録されている状態で何かが入力されたということは日時が登録されていないということで日時関係のsetDateにいく。
           replyText = setDate(userDataRow, message);
           
         }
         else { //リマインダーもタスクも登録されていないのでsetTodoから予定を登録する。
           replyText = setTodo(userDataRow, message);
         }
         */
        /*-----------------------------------------------------------------------------------------------------------------------------------------------------------
        1/17日ここまで アップデートタイムを登録するところ
        */

        if (writingFlag) { // タスク登録
          replyText = appendToSheetContent(userId, message);
        } else { // 日時登録 ただし 名前の最後のところに記述（IDをもとに出す）
          replyText = setDate(insertionUserDataRow, message);
        }

    }
  } catch (e) {
    replyText = "うまく登録できなかったよ、もう一度送ってね。"
  } finally {
    //ロック解除
    lock.releaseLock();
  }
  //console.log(replyText);
  //console.log(replyToken);
  return sendLineMessageFromReplyToken(replyToken, replyText); //反応してラインに値を送る関数に引数を与える。
}

function canceldata(row) { // キャンセルの場合に動く関数。
  getTodoCelldata(row).clear(); //タスクセル .clear セルの値をクリア。
  getDateCelldata(row).clear(); //日付セル。
  triggerCell = getTriggerCell(row) //トリガーセルの値を代入。
  var triggerId = triggerCell.getValue(); //値を代入。
  if (triggerId) { //値が0以外の時実行 何かある時は実行。
    deleteTrigger(triggerId); // トリガー削除。
  }
  triggerCell.clear(); //トリガーが保存されたセル。
  return 'キャンセルしたよ！'
}

function searchUserDataRow(userId) { // userIdが登録されている検索。 何行目に入っていたかを返却。 ない場合にはfalseを返却。
  userDataRow = searchRowNum(userId, 1); //sheet.gsに関数あり。
  if (userDataRow === false) { //もし登録されていなければ
    appendToSheet(userId); //userIdをレコードの最後に追加。
  }
  return userDataRow; //userIdが何行目かを返却。
}
function setTodo(row, message) { //タスクを登録。
  setFromRowCol(message, row, 1);
  return '「' + message + ' 」だね。覚えたよ\nいつ教えてほしい？\n例：「10分後」「11月23日17時00分」など\n「○分後」か、「○月○日○時○分」形式で教えてね。そうしないと正しく時間を登録できないよ！\n「キャンセル」って言ってくれればやめるよ。';
}




function VerificationDate(message) { //日時を書き込む為の関数。入力されたメッセージから日付を整えるDate
  // 全角英数を半角に変換
  var date = Moment.moment().format('YYYY年MM月DD日H時m分s');//現在日時取得。 YYYY年MM月DD日H時m分s
  var Ndate = date;
  console.log(date);
  console.log(Ndate);
  // 全角英数を半角に変換
  message = message.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) { //新しい文字列を作る為の関数を指定。
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0); // 全角英数を半角に変換。
  });
  message = message.replace(/一/g, 1); // 漢数字から数字へ
  message = message.replace(/二/g, 2);
  message = message.replace(/三/g, 3);
  message = message.replace(/四/g, 4);
  message = message.replace(/五/g, 5);
  message = message.replace(/六/g, 6);
  message = message.replace(/七/g, 7);
  message = message.replace(/八/g, 8);
  message = message.replace(/九/g, 9);
  message = message.replace(/(\d)十/g, "$1" + 0); // 漢数字から数字へ
  message = message.replace(/十/g, 10);
  // 明日 明後日 明々後日
  if (message.match(/\d+[年月日時分]後|\d+[日時分]間後|\d+ヶ月後/)) { // 数字後の場合には現在の時刻から加算。
    if (message.match(/\d+年後/)) {
      var match = message.match(/\d+年後/)[0].match(/\d+/)[0];
      match = parseInt(match, 10);
      date = Moment.moment(date, 'Y年M月D日H時m分').add(match, 'years').format('YYYY年MM月DD日H時m分');
    }
    if (message.match(/\d+月後|\d+ヶ月後/)) {
      match = message.match(/\d+月後|\d+ヶ月後/)[0].match(/\d+/)[0];
      match = parseInt(match, 10);
      date = Moment.moment(date, 'Y年M月D日H時m分').add(match, 'months').format('YYYY年MM月DD日H時m分');
    }
    if (message.match(/\d+日後|\d+日間後/)) {
      match = message.match(/\d+日後|\d+日間後/)[0].match(/\d+/)[0];
      match = parseInt(match, 10);
      date = Moment.moment(date, 'Y年M月D日H時m分').add(match, 'days').format('YYYY年MM月DD日H時m分');
    }
    if (message.match(/\d+時後|\d+時間後/)) {
      match = message.match(/\d+時後|\d+時間後/)[0].match(/\d+/)[0];
      match = parseInt(match, 10);
      date = Moment.moment(date, 'Y年M月D日H時m分').add(match, 'hours').format('YYYY年MM月DD日H時m分');
    }
    if (message.match(/\d+分後|\d+分間後/)) {
      match = message.match(/\d+分後|\d+分間後/)[0].match(/\d+/)[0];
      match = parseInt(match, 10);
      date = Moment.moment(date, 'Y年M月D日H時m分').add(match, 'minutes').format('YYYY年MM月DD日H時m分');
    }
    // ------------------------------------------------------------------------------------
  }
  if (message.match(/\d+[年月日時分]|\d+[日時分]間|d+ヶ月/)) {// 指定された日時を保存。
    if (message.match(/\d+年(?!後)/)) {
      match = message.match(/\d+年(?!後)/)[0];
      date = date.replace(/\d+年/, match);
    }
    if (message.match(/\d+月(?!後)|\d+ヶ月(?!後)/)) {
      match = message.match(/\d+月(?!後)|\d+ヶ月(?!後)/)[0].match(/\d+/)[0];
      match = parseInt(match, 10);
      date = date.replace(/\d+月/, match + "月");
    }
    if (message.match(/\d+日(?!後)|\d+日間(?!後)/)) {
      match = message.match(/\d+日(?!後)|\d+日間(?!後)/)[0].match(/\d+/)[0];
      match = parseInt(match, 10);
      date = date.replace(/\d+日/, match + "日");
    }
    if (message.match(/\d+時(?!後)|\d+時間(?!後)/)) {
      match = message.match(/\d+時(?!後)|\d+時間(?!後)/)[0].match(/\d+/)[0];
      match = parseInt(match, 10);
      date = date.replace(/\d+時/, match + "時");
    }
    if (message.match(/\d+分(?!後)|\d+分間(?!後)/)) {
      match = message.match(/\d+分(?!後)|\d+分間(?!後)/)[0].match(/\d+/)[0];
      match = parseInt(match, 10);
      date = date.replace(/\d+分/, match + "分");
    }
  }
  if (message.match("明日")) {
    date = Moment.moment(date, 'Y年M月D日H時m分').add(1, 'days').format('YYYY年MM月DD日H時m分');
  }
  if (message.match("明後日")) {
    date = Moment.moment(date, 'Y年M月D日H時m分').add(2, 'days').format('YYYY年MM月DD日H時m分');
  }
  if (message.match("明々後日")) {
    date = Moment.moment(date, 'Y年M月D日H時m分').add(3, 'days').format('YYYY年MM月DD日H時m分');
  }
  if (message.match("来週")) {
    date = Moment.moment(date, 'Y年M月D日H時m分').add(7, 'days').format('YYYY年MM月DD日H時m分');
  }
  if (message.match("再来週")) {
    date = Moment.moment(date, 'Y年M月D日H時m分').add(14, 'days').format('YYYY年MM月DD日H時m分');
  }
  var Ddate = date;
  date = Moment.moment(date, 'YYYY年M月D日H時m分').format('YYYY年MM月DD日H時m分');

  if (Ndate === Ddate) {
    date = message;
  }

  return date;

}



function setDate(row, message) { //日時を書き込む為の関数。
  // 全角英数を半角に変換
  var date = Moment.moment().format('YYYY年MM月DD日H時m分');//現在日時取得。 YYYY年MM月DD日H時m分
  var truedate = date; // 正しい日付。

  date = VerificationDate(message);
  date = Moment.moment(date, 'YYYY年M月D日H時m分').format('YYYY年MM月DD日H時m分');

  if (date === truedate || date === 'Invalid date') { //時間文字列として無効な場合には 
    return '「10分後」「11月23日17時00分」など\n「○分後」か、「○月○日○時○分」形式で知らせる時間を教えてね。そうしないと正しく時間を登録できないよ！'
  } else if (Moment.moment(date, 'YYYY年M月D日H時m分') < Moment.moment(truedate, 'YYYY年M月D日H時m分')) { //現在の時刻よりも前ならば
    return '過去の時間に知らせてもらいたいなんて少し深めの闇を感じるね...'
  }
  // 一分後の場合には処理に手間がかかるので処理を受け付けない。
  var upDateDate;
  var upDateTime;
  upDateDate = Moment.moment(date, 'YYYY年M月D日H時m分').format('YYYY-MM-DD');
  upDateTime = Moment.moment(date, 'YYYY年M月D日H時m分').format('H:m:0');
  //setTrigger(row, date); //トリガーとなるIDを作成。
  setDateTimeRowCol(upDateDate, upDateTime, row); //その時間を書き込み。
  return date + 'だね。覚えたよ！\nその時間になったら知らせるね。'
}
// 時間として正しければTrue
function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

function setDateVerification(row, message) { //日時を書き込む為の関数。 
  // 全角英数を半角に変換
  var DZdate;
  var d = Moment.moment().format('YYYY年MM月DD日H時m分');//現在日時取得。 YYYY年MM月DD日H時m分
  DZdate = VerificationDate(message);
  // formatで直さなければ上位層が使われるので注意
  d = Moment.moment(DZdate, 'YYYY年M月D日H時m分').format('YYYY年MM月DD日H時m分');


  if (d === 'Invalid date') { //時間文字列として無効な場合には 
    return '「10分後」「11月23日17時00分」など\n「○分後」か、「○月○日○時○分」形式で知らせる時間を教えてね。そうしないと正しく時間を登録できないよ！'
  }
  SelectToCheckScheduleSheet(DZdate, row, 3);
  return DZdate + 'だね。覚えたよ！\n終わりの日付を入力してね。'
}

function ReturnDateVerification(date, message, row, deleteFlg) { //日時を書き込む為の関数。 
  // 全角英数を半角に変換
  var d = Moment.moment().format('YYYY年MM月DD日H時m分');//現在日時取得。 YYYY年MM月DD日H時m分

  var Ddate;
  Ddate = VerificationDate(message); // 形式を変更

  d = Moment.moment(Ddate, 'YYYY年M月D日H時m分').format('YYYY年MM月DD日H時m分');

  if (d === 'Invalid date') { //時間文字列として無効な場合には 
    return '「10分後」「11月23日17時00分」など\n「○分後」か、「○月○日○時○分」形式で知らせる時間を教えてね。そうしないと正しく時間を登録できないよ！'
  } else { //正しい値ならば
    if (Moment.moment(date, 'YYYY年M月D日H時m分') > Moment.moment(Ddate, 'YYYY年M月D日H時m分')) {
      var exchange = date;
      date = d;
      d = exchange;

    }

    var replyText = getValuesIDResult();
    var Ver;

    if (deleteFlg == 1) {
      var LineReplyText = date + "から" + d + "の予定を削除したよ\n";
      
      
      replyText.forEach(function (value) {

        Ver = Moment.moment(value[2]).format('YYYY年MM月DD日H時m分');

        if (Moment.moment(Ver, 'YYYY年M月D日H時m分') >= Moment.moment(date, 'YYYY年M月D日H時m分') && Moment.moment(Ver, 'YYYY年M月D日H時m分') <= Moment.moment(d, 'YYYY年M月D日H時m分')) {
          
          resultDelete(value[0] + 1);

        }

      });

      getDeleteCellCheckSchedule(row + 1);

    } else {
      var LineReplyText = date + "から" + d + "の予定を確認するよ\n";
      
      
      replyText.forEach(function (value) {

        Ver = Moment.moment(value[2]).format('YYYY年MM月DD日H時m分');

        if (Moment.moment(Ver, 'YYYY年M月D日H時m分') >= Moment.moment(date, 'YYYY年M月D日H時m分') && Moment.moment(Ver, 'YYYY年M月D日H時m分') <= Moment.moment(d, 'YYYY年M月D日H時m分')) {
          Ver = Moment.moment(value[2]).format('YYYY年MM月DD日');
          LineReplyText += Ver + Moment.moment(value[3]).format('H時m分');
          LineReplyText += ":";
          LineReplyText += value[4];
          LineReplyText += "\n";
        }

      });
      // 値が同じ時 何も値が入っていないため予定なし
      if (LineReplyText == date + "から" + d + "の予定を確認するよ\n") {
        LineReplyText = "予定はないよ";
      } else {
        // 予定削除
        getDeleteCellCheckSchedule(row + 1);

      }
    }




  }

  return LineReplyText;
}
/*-----------------------------------------------------------------------------------------------------------------------------------------------------------
     1/20 追加機能完了
     */


function cancel(row) { // キャンセルの場合に動く関数。 一番最新の値を消す。
  getTodoCell(row).clear(); //タスクセル .clear セルの値をクリア。
  getDateCell(row).clear(); //日付セル。
  triggerCell = getTriggerCell(row) //トリガーセルの値を代入。
  var triggerId = triggerCell.getValue(); //値を代入。
  if (triggerId) { // 値が0以外の時実行 何かある時は実行。
    deleteTrigger(triggerId); // トリガー削除。
  }
  triggerCell.clear(); //トリガーが保存されたセル。
  return 'キャンセルしたよ！'
}

function resultDelete(row) { // resultの値を一番上から削除する。
  var message = "キャンセルできなかったよ";
  console.log("SSSS:" + row);
  message = getDeleteCellWbhook(row);

  return message;
}



// 最新リマインド
function remind(e) { // リマインダトリガ。

  setAAAAAColData();
  // 2行目を確認情報があれば実行なければ取りやめ。
  // 空白true
  if (getIsBlank(1)) {
    return;
  }
  while (!getIsBlank(1)) {
    //探してきた行からUserIdとtodoを特定して、LINEでメッセージを送ります。
    var id = getIdCelldata(1).getValue(); //Idセルの中身を取得代入。 
    var userId = getUserIdCelldata(1).getValue(); //UserIdセルの中身を取得代入。 
    var todo = getTodoCelldata(1).getValue(); //Todoセルの中身を取得代入。
    var remindText = todo + 'の時間だよ！';
    resultDelete(id + 1);
    sendLineMessageFromUserId(userId, remindText); //反応してラインに値を送る関数に引数を与える。
  }
  return;
}

function DeleteAll() { // 全て削除

  console.log(21)
  setAAAAAColData();
  // 2行目を確認情報があれば実行なければ取りやめ。
  // 空白true
  if (getIsBlankIDResult(1)) {
    console.log(22);
    return;
  }
  while (!getIsBlankIDResult(1)) {
    console.log(getIsBlankIDResult(1));
    var id = getIdResultIDCelldata(1).getValue(); //Idセルの中身を取得代入。 
    console.log(23);
    console.log(id);
    resultDelete(id + 1);
  }
  return;
}

// かこの遺産
function HeritageRemind(e) { // リマインダーの為のトリガーとなっているもの。 呼び出し元のトリガーのUniqueIdを調べて、スプレッドシートの4列目からそのUniqueIdが記録されている行を探す。
  //探してきた行からUserIdとtodoを特定して、LINEでメッセージを送ります。
  //UniqueId...日時と、実行する関数を指定して作成されたトリガーの固有ID。
  var userDataRow = searchRowNumData(e.triggerUid, 3);  //トリガーの内容が何行目かを判断。
  var userId = getUserIdCelldata(userDataRow).getValue(); //UserIdセルの中身を取得代入。 
  var todo = getTodoCelldata(userDataRow).getValue(); //Todoセルの中身を取得代入。
  var remindText = todo + 'の時間だよ！';
  cancel(userDataRow);
  return sendLineMessageFromUserId(userId, remindText); //反応してラインに値を送る関数に引数を与える。
}

function getIsBlank(row) {// 空白かどうか resultから取得

  var getsheet = SpreadsheetApp.openById("1Gyw_0oNk-sR5VtjxZVsZlEzgl62aDNpcE-DHqTN9a1U");
  var sheet = getsheet.getSheetByName('result');
  var val = sheet.getRange(row + 1, 5);
  //console.log(sheet.getDataRange().getValues());
  return val.isBlank();
}


function getIsBlankIDResult(row) {// 空白かどうか IDReslultから取得

  var getsheet = SpreadsheetApp.openById("1Gyw_0oNk-sR5VtjxZVsZlEzgl62aDNpcE-DHqTN9a1U");
  var sheet = getsheet.getSheetByName('IDResult');
  var val = sheet.getRange(row + 1, 6);
  //console.log(sheet.getDataRange().getValues());
  return val.isBlank();
}

